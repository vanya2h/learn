import Anthropic from "@anthropic-ai/sdk";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { extractText, getDocumentProxy } from "unpdf";
import { z } from "zod";
import { db } from "../db";
import type { AuthEnv } from "../middleware/requireAuth";

const PDF_TEXT_MAX_CHARS = 10_000;
const PROFILE_MARKDOWN_MAX_CHARS = 2_000;

const EXTRACTION_SYSTEM = `You analyze a candidate's CV and produce a TINY profile that downstream tools use to tailor learning curriculums.

Use the \`save_profile\` tool to return your output. Do not return text outside of the tool call.

CRITICAL: the markdown must be SHORT — under 200 words total. This is a context blob, not a CV summary. Every word is sent on every downstream LLM call. Be ruthlessly terse.

The \`markdown\` field must follow this exact structure:

## Summary
ONE sentence. Format: "[Seniority] [primary role] with ~N years, working in [domains]. Strongest in [top 1-2 areas]."
Example: "Senior fullstack engineer with ~8 years, working in fintech and devtools. Strongest in TypeScript and distributed systems."

## Stack
3-6 bullets MAX. One line each: \`- **Skill** (deep|working|familiar) — short context\`
Example: \`- **TypeScript** (deep) — primary language, 8 yrs across FE and BE\`

## Recent
1-2 bullets MAX. One line each: \`- **Role @ Company** — what they built, key stack\`

DROP entirely: contact info, dates, education (unless recent grad), soft skills, hobbies, languages, references, every "responsibilities" bullet, every project unless it shows a unique skill not already in Stack.

Do not invent. If depth is ambiguous, prefer "working" over "deep".

The \`targetRoles\` field is REQUIRED — never empty if the CV has any work history.
- If the CV explicitly states target roles (objective / headline / "looking for"), use those.
- Otherwise, INFER 2-3 plausible target roles from the candidate's seniority, primary stack, and recent trajectory.
- Format like job titles: "Senior Frontend Engineer", "Founding Engineer", "Staff Backend Engineer", "Tech Lead".
- 2-4 entries. Be specific (include level + specialization), not generic ("Software Engineer").`;

const profileExtractionInputSchema = z.object({
  markdown: z.string().min(1),
  targetRoles: z.array(z.string()).max(8),
});

type ProfileExtraction = z.infer<typeof profileExtractionInputSchema>;

const updateProfileSchema = z.object({
  markdown: z.string().max(PROFILE_MARKDOWN_MAX_CHARS).optional(),
  targetRoles: z.array(z.string().min(1).max(80)).max(8).optional(),
});

const uploadSchema = z.object({
  file: z.instanceof(File),
});

async function extractProfileFromPdfText(text: string): Promise<ProfileExtraction> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: EXTRACTION_SYSTEM,
    tools: [
      {
        name: "save_profile",
        description: "Persist the structured profile extracted from the CV.",
        input_schema: {
          type: "object",
          properties: {
            markdown: {
              type: "string",
              description: "The dense profile markdown following the required section structure.",
            },
            targetRoles: {
              type: "array",
              items: { type: "string" },
              description: "Target roles extracted from the CV. Empty if not stated.",
            },
          },
          required: ["markdown", "targetRoles"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "save_profile" },
    messages: [{ role: "user", content: `CV text:\n\n${text}` }],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use" || toolUse.name !== "save_profile") {
    throw new Error("Model did not return a save_profile tool call");
  }

  const parsed = profileExtractionInputSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error("Profile tool call did not match schema");
  }
  return parsed.data;
}

export const profileRoute = new Hono<AuthEnv>()
  .get("/profile", async (c) => {
    const userId = c.var.user.id;
    const profile = await db.userProfile.findUnique({ where: { userId } });
    return c.json({
      profile: profile
        ? {
            markdown: profile.markdown,
            targetRoles: profile.targetRoles,
            updatedAt: profile.updatedAt.toISOString(),
          }
        : null,
    });
  })

  .post("/profile/upload", zValidator("form", uploadSchema), async (c) => {
    const userId = c.var.user.id;
    const { file } = c.req.valid("form");

    if (file.type !== "application/pdf") {
      return c.json({ error: "File must be a PDF." }, 400);
    }

    let text: string;
    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(buffer);
      const { text: raw } = await extractText(pdf, { mergePages: true });
      text = raw.replace(/\s+/g, " ").trim().slice(0, PDF_TEXT_MAX_CHARS);
    } catch (err) {
      console.error("[profile/upload] pdf parse error:", err);
      return c.json({ error: "We couldn't read this PDF. Try a text-based version (not a scan)." }, 400);
    }

    if (!text || text.length < 100) {
      return c.json({ error: "We couldn't read this PDF. Try a text-based version (not a scan)." }, 400);
    }

    let extracted: ProfileExtraction;
    try {
      extracted = await extractProfileFromPdfText(text);
    } catch (err) {
      console.error("[profile/upload] extraction error:", err);
      return c.json(
        {
          error: "We couldn't parse a profile from this CV. You can fill in your profile manually instead.",
          allowManualFallback: true,
        },
        422,
      );
    }

    const profile = await db.userProfile.upsert({
      where: { userId },
      update: { markdown: extracted.markdown, targetRoles: extracted.targetRoles },
      create: { userId, markdown: extracted.markdown, targetRoles: extracted.targetRoles },
    });

    return c.json({
      profile: {
        markdown: profile.markdown,
        targetRoles: profile.targetRoles,
        updatedAt: profile.updatedAt.toISOString(),
      },
    });
  })

  .patch("/profile", zValidator("json", updateProfileSchema), async (c) => {
    const userId = c.var.user.id;
    const { markdown, targetRoles } = c.req.valid("json");

    if (markdown === undefined && targetRoles === undefined) {
      return c.json({ error: "Nothing to update" }, 400);
    }

    const profile = await db.userProfile.upsert({
      where: { userId },
      update: {
        ...(markdown !== undefined ? { markdown } : {}),
        ...(targetRoles !== undefined ? { targetRoles } : {}),
      },
      create: {
        userId,
        markdown: markdown ?? "",
        targetRoles: targetRoles ?? [],
      },
    });

    return c.json({
      profile: {
        markdown: profile.markdown,
        targetRoles: profile.targetRoles,
        updatedAt: profile.updatedAt.toISOString(),
      },
    });
  })

  .post("/profile/skip-onboarding", async (c) => {
    const userId = c.var.user.id;
    await db.user.update({ where: { id: userId }, data: { onboardingSkipped: true } });
    return c.json({ ok: true });
  })

  .delete("/profile", async (c) => {
    const userId = c.var.user.id;
    await db.userProfile.deleteMany({ where: { userId } });
    return c.json({ ok: true });
  });
