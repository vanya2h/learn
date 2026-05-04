import Anthropic from "@anthropic-ai/sdk";
import { zValidator } from "@hono/zod-validator";
import type { Prisma } from "@prisma/client-generated";
import { Hono } from "hono";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";
import { CUSTOM_CURRICULUM_COVER } from "../../data/cover-image";
import { OutlinePhaseSchema, PhaseSchema, SkillSchema } from "../../data/types";
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

const OUTLINE_SYSTEM = `You generate interview-prep curriculum outlines from job postings.

The user will provide a job posting's text content. Analyze it and produce a JSON object matching this TypeScript type:

\`\`\`ts
type CurriculumOutline = {
  id: string;          // kebab-case slug, e.g. "stripe-senior-frontend"
  name: string;        // "Company — Role Prep"
  description: string; // one-sentence summary
  phases: PhaseOutline[];  // 4-7 phases, ordered: foundations → domain → advanced → mock interviews
  skills: Skill[];     // one skill unlocked per phase
};
type PhaseOutline = {
  id: string;          // kebab-case, prefixed per domain (e.g. "fe-", "sys-", "algo-", "co-")
  title: string;
  subtitle: string;    // one sentence describing what this phase prepares the candidate for
};
type Skill = {
  id: string;
  name: string;
  description: string;
  unlockedBy: { phaseId: string }; // references a phase id
};
\`\`\`

Rules:
- Tailor phases to the SPECIFIC job requirements.
- Do NOT include tasks — only phase structure and skills.
- All IDs must be unique and kebab-case.
- Always end with a "mock interview + practice" phase and a "company research" phase.
- Output ONLY valid JSON — no markdown fences, no commentary.
- If the user provides feedback, incorporate it into the revised outline.`;

const PHASE_SYSTEM = `You generate the tasks for one specific phase of an interview-prep curriculum.

The user provides the job posting, the full curriculum outline, any already-generated phases (for context), and which phase index to generate.

Produce a JSON object for JUST that one phase:

\`\`\`ts
type Phase = {
  id: string;         // match the id from the outline exactly
  title: string;      // match the title from the outline exactly
  subtitle: string;   // match the subtitle from the outline exactly
  tasks: Task[];      // 4-8 tasks
};
type Task = {
  id: string;         // kebab-case, use the phase id as a prefix (e.g. "fe-basics-read-docs")
  title: string;      // actionable: "Read X", "Build Y", "Practice Z", "Watch X"
  estMinutes: number; // realistic: reading 60-120, building 120-240, review 30-60
};
\`\`\`

Rules:
- Copy the phase id, title, subtitle exactly from the outline.
- Tasks must be concrete and actionable — not vague. Each scoped to a single sitting.
- Do not duplicate tasks that appear in already-generated phases.
- Output ONLY valid JSON — no markdown fences, no commentary.
- If the user provides feedback, incorporate it.`;

const PDF_FALLBACK_HINT =
  "Couldn't read the job posting from this URL — many sites render content with JavaScript and aren't readable as plain HTML. Try opening the page in your browser, saving it as a PDF, and using the PDF upload option instead.";

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000);
}

function streamLLM(system: string, userMessage: string, locale: Locale | undefined, maxTokens = 4000): Response {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const anthropic = new Anthropic({ apiKey });
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: locale ? localizeSystem(locale, system) : system,
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
        console.error("[curriculum] stream error:", err);
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

const generateSchema = z.object({
  url: z.url(),
  feedback: z.string().optional(),
  locale: z.enum(LOCALES).optional(),
});

const generateFromPdfSchema = z.object({
  file: z.instanceof(File),
  feedback: z.string().optional(),
  locale: z.enum(LOCALES).optional(),
});

const extractSchema = z.object({ url: z.url() });
const extractPdfSchema = z.object({ file: z.instanceof(File) });

const generateOutlineSchema = z.object({
  textContent: z.string().min(100),
  feedback: z.string().optional(),
  locale: z.enum(LOCALES).optional(),
});

const generatePhaseSchema = z.object({
  textContent: z.string().min(100),
  outline: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    phases: z.array(OutlinePhaseSchema).min(1),
    skills: z.array(SkillSchema).optional(),
  }),
  phaseIndex: z.number().int().min(0),
  completedPhases: z.array(PhaseSchema).optional(),
  feedback: z.string().optional(),
  locale: z.enum(LOCALES).optional(),
});

const saveSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  jobUrl: z.url().optional(),
  phases: z.array(PhaseSchema).min(1),
  skills: z.array(SkillSchema).optional(),
});

export const curriculumRoute = new Hono<AuthEnv>()
  .post("/curriculums/extract", zValidator("json", extractSchema), async (c) => {
    const { url } = c.req.valid("json");

    let pageText: string;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CurriculumBot/1.0)" },
      });
      if (!res.ok) return c.json({ error: PDF_FALLBACK_HINT }, 400);
      pageText = await res.text();
    } catch {
      return c.json({ error: PDF_FALLBACK_HINT }, 400);
    }

    const text = cleanHtml(pageText);
    if (text.length < 300) return c.json({ error: PDF_FALLBACK_HINT }, 400);
    return c.json({ text });
  })
  .post("/curriculums/extract-pdf", zValidator("form", extractPdfSchema), async (c) => {
    const { file } = c.req.valid("form");
    if (file.type !== "application/pdf") return c.json({ error: "File must be a PDF" }, 400);

    let text: string;
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(buffer);
      const { text: raw } = await extractText(pdf, { mergePages: true });
      text = raw.replace(/\s+/g, " ").trim().slice(0, 15000);
    } catch (err) {
      console.error("[curriculum/extract-pdf] parse error:", err);
      return c.json({ error: "Failed to parse PDF" }, 400);
    }

    if (!text) return c.json({ error: "PDF contained no extractable text" }, 400);
    return c.json({ text });
  })
  .post("/curriculums/generate-outline", zValidator("json", generateOutlineSchema), async (c) => {
    if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "ANTHROPIC_API_KEY is not set" }, 500);
    const { textContent, feedback, locale } = c.req.valid("json");

    const userMessage = feedback
      ? `Job posting:\n\n${textContent}\n\nFeedback on previous outline:\n${feedback}`
      : `Job posting:\n\n${textContent}`;

    return streamLLM(OUTLINE_SYSTEM, userMessage, locale, 2000);
  })
  .post("/curriculums/generate-phase", zValidator("json", generatePhaseSchema), async (c) => {
    if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "ANTHROPIC_API_KEY is not set" }, 500);
    const { textContent, outline, phaseIndex, completedPhases, feedback, locale } = c.req.valid("json");

    if (phaseIndex >= outline.phases.length) return c.json({ error: "Invalid phase index" }, 400);

    const phase = outline.phases[phaseIndex]!;
    const completedSection =
      completedPhases && completedPhases.length > 0
        ? `\nAlready generated phases (for context — do not duplicate tasks):\n${JSON.stringify(completedPhases, null, 2)}\n`
        : "";

    const userMessage = [
      `Job posting:\n\n${textContent}`,
      `\n\nCurriculum outline:\n${JSON.stringify(outline, null, 2)}`,
      completedSection,
      `\n\nGenerate tasks for phase ${phaseIndex + 1} of ${outline.phases.length}: "${phase.title}" (id: "${phase.id}")`,
      feedback ? `\n\nFeedback to incorporate: ${feedback}` : "",
    ].join("");

    return streamLLM(PHASE_SYSTEM, userMessage, locale, 1500);
  })
  .post("/curriculums/generate", zValidator("json", generateSchema), async (c) => {
    const { url, feedback, locale } = c.req.valid("json");
    if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: "ANTHROPIC_API_KEY is not set" }, 500);

    let pageText: string;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CurriculumBot/1.0)" },
      });
      if (!res.ok) return c.json({ error: PDF_FALLBACK_HINT }, 400);
      pageText = await res.text();
    } catch {
      return c.json({ error: PDF_FALLBACK_HINT }, 400);
    }

    const textContent = cleanHtml(pageText);
    if (textContent.length < 300) return c.json({ error: PDF_FALLBACK_HINT }, 400);

    const userMessage = feedback
      ? `Job posting:\n\n${textContent}\n\nUser feedback on previous generation:\n${feedback}`
      : `Job posting:\n\n${textContent}`;

    return streamLLM(GENERATE_SYSTEM, userMessage, locale);
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

    const userMessage = feedback
      ? `Job posting:\n\n${textContent}\n\nUser feedback on previous generation:\n${feedback}`
      : `Job posting:\n\n${textContent}`;

    return streamLLM(GENERATE_SYSTEM, userMessage, locale);
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
        coverImage: CUSTOM_CURRICULUM_COVER,
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
