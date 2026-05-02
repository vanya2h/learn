import Anthropic from "@anthropic-ai/sdk";
import { zValidator } from "@hono/zod-validator";
import type { Prisma } from "@prisma/client-generated";
import { Hono } from "hono";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";
import { PhaseSchema, SkillSchema } from "../../data/types";
import type { Locale } from "../../lib/i18n";
import { LOCALES, localizeSystem } from "../../lib/i18n";
import { db } from "../db";
import type { AuthEnv } from "../middleware/requireAuth";

const GENERATE_SYSTEM = `You generate interview-prep curriculums from job postings.

The user will provide a job posting's text content. Analyze it and produce a JSON object matching this TypeScript type:

\`\`\`ts
type CurriculumDef = {
  id: string;          // kebab-case slug, e.g. "stripe-senior-frontend"
  name: string;        // "Company — Role Prep"
  description: string; // one-sentence summary
  phases: Phase[];     // 4-7 phases
  skills: Skill[];     // one per phase
};
type Phase = {
  id: string;          // kebab-case, prefixed per domain (e.g. "fe-", "sys-", "algo-")
  title: string;
  subtitle: string;    // one sentence of guidance
  tasks: Task[];       // 4-8 tasks per phase
};
type Task = {
  id: string;          // kebab-case, prefixed with short phase abbrev
  title: string;       // actionable: "Read X", "Build Y", "Practice Z"
  estMinutes: number;  // realistic: reading 60-120, building 120-240, review 30-60
};
type Skill = {
  id: string;
  name: string;
  description: string;
  unlockedBy: { phaseId: string }; // references a phase id
};
\`\`\`

Rules:
- Tailor phases to the SPECIFIC job requirements. If the job needs Kubernetes, include a Kubernetes phase. If it's frontend, make system design frontend-flavored.
- Tasks must be concrete and actionable — not vague. Each scoped to a single sitting.
- All IDs must be unique and kebab-case.
- Always include a "mock interview + practice" phase and a "company research" phase at the end.
- Output ONLY valid JSON — no markdown fences, no commentary.
- If the user provides feedback, incorporate it into the revised curriculum.`;

const generateSchema = z.object({
  url: z.string().url(),
  feedback: z.string().optional(),
  locale: z.enum(LOCALES).optional(),
});

const generateFromPdfSchema = z.object({
  file: z.instanceof(File),
  feedback: z.string().optional(),
  locale: z.enum(LOCALES).optional(),
});

const saveSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  jobUrl: z.string().url().optional(),
  phases: z.array(PhaseSchema).min(1),
  skills: z.array(SkillSchema).optional(),
});

function streamCurriculum(textContent: string, feedback: string | undefined, locale: Locale | undefined): Response {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const userMessage = feedback
    ? `Job posting:\n\n${textContent}\n\nUser feedback on previous generation:\n${feedback}`
    : `Job posting:\n\n${textContent}`;

  const anthropic = new Anthropic({ apiKey });
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: locale ? localizeSystem(locale, GENERATE_SYSTEM) : GENERATE_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event.delta.text)}\n\n`));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[curriculum/generate] stream error:", err);
        controller.error(err);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export const curriculumRoute = new Hono<AuthEnv>()
  .post("/curriculums/generate", zValidator("json", generateSchema), async (c) => {
    const { url, feedback, locale } = c.req.valid("json");
    if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "ANTHROPIC_API_KEY is not set" }, 500);

    const pdfFallbackHint =
      "Couldn't read the job posting from this URL — many sites render content with JavaScript and aren't readable as plain HTML. Try opening the page in your browser, saving it as a PDF, and using the PDF upload option instead.";

    let pageText: string;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CurriculumBot/1.0)" },
      });
      if (!res.ok) return c.json({ error: pdfFallbackHint }, 400);
      pageText = await res.text();
    } catch {
      return c.json({ error: pdfFallbackHint }, 400);
    }

    const textContent = pageText
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000);

    if (textContent.length < 300) return c.json({ error: pdfFallbackHint }, 400);

    return streamCurriculum(textContent, feedback, locale);
  })
  .post("/curriculums/generate-from-pdf", zValidator("form", generateFromPdfSchema), async (c) => {
    const { file, feedback, locale } = c.req.valid("form");
    if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "ANTHROPIC_API_KEY is not set" }, 500);
    if (file.type !== "application/pdf") return c.json({ error: "File must be a PDF" }, 400);

    let textContent: string;
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(buffer);
      const { text } = await extractText(pdf, { mergePages: true });
      textContent = text.replace(/\s+/g, " ").trim().slice(0, 15000);
    } catch (err) {
      console.error("[curriculum/generate-from-pdf] parse error:", err);
      return c.json({ error: "Failed to parse PDF" }, 400);
    }

    if (!textContent) return c.json({ error: "PDF contained no extractable text" }, 400);

    return streamCurriculum(textContent, feedback, locale);
  })
  .post("/curriculums", zValidator("json", saveSchema), async (c) => {
    const userId = c.get("user").id;
    const { name, description, jobUrl, phases, skills } = c.req.valid("json");

    const record = await db.customCurriculum.create({
      data: {
        userId,
        name,
        description,
        jobUrl,
        phases: phases as Prisma.InputJsonValue,
        skills: skills ? (skills as Prisma.InputJsonValue) : undefined,
      },
    });

    return c.json({ id: record.id });
  })
  .delete("/curriculums/:id", async (c) => {
    const userId = c.get("user").id;
    const id = c.req.param("id");

    await db.customCurriculum.deleteMany({ where: { id, userId } });
    return c.json({ ok: true });
  });
