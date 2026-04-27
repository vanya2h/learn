import { useEffect, useRef, useState } from "react";
import { CURRICULUMS } from "../data/curriculum";
import { useClaude } from "../lib/claude";
import { useStore } from "../store";

// ── Types ─────────────────────────────────────────────────────────────────────

type StudyPart = {
  title: string;
  study: string;
  handsOn: string;
  writeUpPrompt: string;
};

type Material = {
  parts: StudyPart[];
  finalTest: Array<{ question: string; hint?: string }>;
};

type SessionPhase =
  | { name: "choice" }
  | {
      name: "assessing";
      status: "loading" | "answering" | "evaluating";
      questions: string[];
      answers: Record<number, string>;
      evalStream: string;
    }
  | { name: "loading"; stream: string }
  | {
      name: "part";
      material: Material;
      partIdx: number;
      step: "study" | "hands-on" | "write-up";
      userText: string;
      feedback: string;
      feedbackStreaming: boolean;
    }
  | {
      name: "final-test";
      material: Material;
      answers: Record<number, string>;
      grading: string;
      gradingDone: boolean;
      passed: boolean;
    }
  | { name: "complete" }
  | { name: "error"; message: string };

// ── Prompts ───────────────────────────────────────────────────────────────────

const MATERIAL_SYSTEM = `You are an expert tutor creating a structured study session for a senior software developer.
Respond with ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "parts": [
    {
      "title": "concise part title",
      "study": "in-depth explanation with examples (plain text, 300-600 words, use \\n for line breaks)",
      "handsOn": "specific practical exercise to attempt (plain text, be concrete — coding task, design problem, or scenario to analyze)",
      "writeUpPrompt": "one targeted reflection question"
    }
  ],
  "finalTest": [
    { "question": "test question", "hint": "optional hint or empty string" }
  ]
}
Rules:
- 2–4 parts, ordered from foundational to advanced
- Study: explain the WHY and trade-offs, use code examples where relevant (inline, no fences)
- Hands-on: concrete enough that the learner knows exactly what to produce
- finalTest: 5–6 questions mixing conceptual and applied, no trivial questions
- Write for a senior developer: go deep, skip the obvious`;

const ASSESSMENT_SYSTEM = `You are an expert tutor generating a quick knowledge assessment.
Respond with ONLY valid JSON — no markdown, no explanation:
{ "questions": ["question 1", "question 2", "question 3", "question 4"] }
Requirements: exactly 4 short-answer questions, test genuine understanding not memorization, reveal gaps when answered poorly, each answerable in 2-4 sentences.`;

const ASSESSMENT_EVAL_SYSTEM = `You are an expert tutor analyzing assessment answers.
Respond with ONLY valid JSON — no markdown, no explanation:
{ "summary": "1 sentence on current knowledge level", "gaps": ["concept needing focus", ...] }
Be accurate. gaps can be empty array. Max 3 gaps.`;

const WRITEUP_SYSTEM = `You are a concise, supportive tutor reviewing a learner's reflection. Keep response under 100 words.
1 sentence: acknowledge what they captured well.
1-2 sentences: the most important thing to think more deeply about.
1 sentence: one concrete suggestion for deepening understanding.`;

const GRADING_SYSTEM = `You are an expert tutor grading a final knowledge test.
Respond with ONLY valid JSON — no markdown, no explanation:
{ "score": 0-100, "passed": true or false, "feedback": "2-3 sentences on overall performance and what to review" }
Passing threshold: 70. Award generous partial credit. Evaluate understanding over exact wording.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJSON<T>(text: string): T {
  const withoutFences = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  try {
    return JSON.parse(withoutFences) as T;
  } catch {
    const match = withoutFences.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match?.[1]) return JSON.parse(match[1]) as T;
    throw new Error(`Could not parse JSON from AI response. Raw: ${withoutFences.slice(0, 120)}`);
  }
}

function parseMaterial(text: string): Material {
  const raw = parseJSON<Partial<Material>>(text);
  return {
    parts: Array.isArray(raw.parts) ? raw.parts : [],
    finalTest: Array.isArray(raw.finalTest) ? raw.finalTest : [],
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" aria-hidden />
  );
}

function StudyContent({ content }: { content: string }) {
  const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g);
  return (
    <div className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 space-y-3">
      {parts.map((part, i) =>
        part.startsWith("```") ? (
          <pre
            key={i}
            className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 text-xs overflow-x-auto font-mono whitespace-pre"
          >
            {part.replace(/^```[\w]*\n/, "").replace(/```$/, "")}
          </pre>
        ) : (
          <div key={i} className="whitespace-pre-wrap">
            {part}
          </div>
        ),
      )}
    </div>
  );
}

function PartProgress({
  partIdx,
  total,
  step,
}: {
  partIdx: number;
  total: number;
  step: "study" | "hands-on" | "write-up";
}) {
  return (
    <div className="flex items-center gap-2 text-xs mb-6">
      <span className="text-neutral-500 dark:text-neutral-400">
        Part {partIdx + 1} of {total}
      </span>
      <span className="text-neutral-300 dark:text-neutral-700">·</span>
      {(["study", "hands-on", "write-up"] as const).map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          {i > 0 && <span className="text-neutral-300 dark:text-neutral-700">→</span>}
          <span
            className={
              step === s ? "text-green-600 dark:text-green-400 font-semibold" : "text-neutral-400 dark:text-neutral-600"
            }
          >
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
    />
  );
}

function Btn({
  onClick,
  disabled,
  children,
  variant = "primary",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-green-600 text-white hover:bg-green-700"
      : "border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

// ── Section: Choice ───────────────────────────────────────────────────────────

function ChoiceSection({ onScratch, onAssess }: { onScratch: () => void; onAssess: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">How do you want to start?</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-10 max-w-sm">
        Take a quick test to surface gaps and personalize the material, or dive straight in from the beginning.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <button
          onClick={onAssess}
          className="flex flex-col items-start gap-2 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 p-5 text-left hover:border-green-500 dark:hover:border-green-500 transition-colors"
        >
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">Quick assessment first</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Answer 4 questions so the AI can focus on your gaps
          </span>
        </button>
        <button
          onClick={onScratch}
          className="flex flex-col items-start gap-2 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 p-5 text-left hover:border-green-500 dark:hover:border-green-500 transition-colors"
        >
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">Start from scratch</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Full comprehensive material from the beginning
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Section: Assessment ───────────────────────────────────────────────────────

function AssessmentSection({
  phase,
  onAnswerChange,
  onSubmit,
}: {
  phase: Extract<SessionPhase, { name: "assessing" }>;
  onAnswerChange: (idx: number, text: string) => void;
  onSubmit: () => void;
}) {
  if (phase.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Preparing assessment questions…</p>
      </div>
    );
  }

  if (phase.status === "evaluating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner />
        <div className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm text-center">
          Evaluating your answers and personalizing the study session…
        </div>
        {phase.evalStream && (
          <div className="text-xs text-neutral-400 dark:text-neutral-600 max-w-sm text-center italic">
            {phase.evalStream.slice(0, 120)}
            {phase.evalStream.length > 120 ? "…" : ""}
          </div>
        )}
      </div>
    );
  }

  const allAnswered = phase.questions.every((_, i) => (phase.answers[i] ?? "").trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Quick Assessment</h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-8">
        Answer each question in 2–4 sentences. Honest answers get more useful material.
      </p>
      <div className="flex flex-col gap-6">
        {phase.questions.map((q, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
              {i + 1}. {q}
            </p>
            <Textarea
              value={phase.answers[i] ?? ""}
              onChange={(v) => onAnswerChange(i, v)}
              placeholder="Your answer…"
              rows={3}
            />
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Btn onClick={onSubmit} disabled={!allAnswered}>
          Submit answers →
        </Btn>
      </div>
    </div>
  );
}

// ── Section: Loading ──────────────────────────────────────────────────────────

function LoadingSection({ stream }: { stream: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
      <Spinner />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Preparing your personalized study session…</p>
      {stream && (
        <div className="text-xs text-neutral-400 dark:text-neutral-600 max-w-sm text-center font-mono">
          {stream.slice(-80)}
        </div>
      )}
    </div>
  );
}

// ── Section: Part (Study / Hands-on / Write-up) ────────────────────────────────

function PartSection({
  phase,
  onUpdateText,
  onNextStep,
  onSubmitWriteUp,
  onNextPart,
}: {
  phase: Extract<SessionPhase, { name: "part" }>;
  onUpdateText: (text: string) => void;
  onNextStep: () => void;
  onSubmitWriteUp: () => void;
  onNextPart: () => void;
}) {
  const { material, partIdx, step, userText, feedback, feedbackStreaming } = phase;
  const part = material.parts[partIdx];
  if (!part) return null;

  const isLastPart = partIdx === material.parts.length - 1;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <PartProgress partIdx={partIdx} total={material.parts.length} step={step} />

      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-6">{part.title}</h2>

      {step === "study" && (
        <>
          <StudyContent content={part.study} />
          <div className="mt-8">
            <Btn onClick={onNextStep}>Got it — move to practice →</Btn>
          </div>
        </>
      )}

      {step === "hands-on" && (
        <>
          <div className="mb-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Exercise
            </p>
            <StudyContent content={part.handsOn} />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Your approach / solution:</p>
          <Textarea
            value={userText}
            onChange={onUpdateText}
            placeholder="Work through the exercise here. Notes, code, your reasoning…"
            rows={6}
          />
          <div className="mt-4">
            <Btn onClick={onNextStep} disabled={userText.trim().length === 0}>
              Done — move to reflection →
            </Btn>
          </div>
        </>
      )}

      {step === "write-up" && (
        <>
          <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
              Reflect
            </p>
            <p className="text-sm text-neutral-800 dark:text-neutral-200">{part.writeUpPrompt}</p>
          </div>

          {!feedback && !feedbackStreaming && (
            <>
              <Textarea
                value={userText}
                onChange={onUpdateText}
                placeholder="Write your reflection in your own words…"
                rows={5}
              />
              <div className="mt-4">
                <Btn onClick={onSubmitWriteUp} disabled={userText.trim().length < 20}>
                  Submit reflection
                </Btn>
              </div>
            </>
          )}

          {(feedback || feedbackStreaming) && (
            <div className="mt-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 italic mb-1">Your reflection:</div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 whitespace-pre-wrap">{userText}</p>

              <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    Tutor feedback
                  </p>
                  {feedbackStreaming && <Spinner />}
                </div>
                <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{feedback}</p>
              </div>

              {!feedbackStreaming && (
                <div className="mt-6">
                  <Btn onClick={onNextPart}>{isLastPart ? "Go to final test →" : "Next part →"}</Btn>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Section: Final Test ────────────────────────────────────────────────────────

function FinalTestSection({
  phase,
  onAnswerChange,
  onSubmit,
  onComplete,
}: {
  phase: Extract<SessionPhase, { name: "final-test" }>;
  onAnswerChange: (idx: number, text: string) => void;
  onSubmit: () => void;
  onComplete: () => void;
}) {
  const { material, answers, grading, gradingDone, passed } = phase;
  const allAnswered = material.finalTest.every((_, i) => (answers[i] ?? "").trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Final Test</h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-8">
        Answer all questions to complete this topic. Passing score: 70%.
      </p>

      <div className="flex flex-col gap-6">
        {material.finalTest.map((q, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
              {i + 1}. {q.question}
            </p>
            {q.hint && <p className="text-xs text-neutral-400 dark:text-neutral-600 italic mb-2">Hint: {q.hint}</p>}
            <Textarea
              value={answers[i] ?? ""}
              onChange={(v) => onAnswerChange(i, v)}
              placeholder="Your answer…"
              rows={3}
            />
          </div>
        ))}
      </div>

      {!grading && !gradingDone && (
        <div className="mt-8">
          <Btn onClick={onSubmit} disabled={!allAnswered}>
            Submit test
          </Btn>
        </div>
      )}

      {grading && (
        <div className="mt-8 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Result
            </p>
            {!gradingDone && <Spinner />}
          </div>
          {gradingDone && (
            <div
              className={`text-sm font-semibold mb-2 ${passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {passed ? "Passed!" : "Not quite — review and try again"}
            </div>
          )}
          <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{grading}</p>
          {gradingDone && (
            <div className="mt-4">
              <Btn onClick={onComplete}>{passed ? "Complete topic →" : "Try again"}</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section: Complete ─────────────────────────────────────────────────────────

function CompleteSection({ taskTitle, onBack }: { taskTitle: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-4xl mb-4">✓</div>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Topic Complete</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm">
        You passed the final test for{" "}
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{taskTitle}</span>. It&apos;s been marked
        as done.
      </p>
      <Btn onClick={onBack}>Back to curriculum</Btn>
    </div>
  );
}

// ── Section: Error ────────────────────────────────────────────────────────────

function ErrorSection({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isApiKey = message.includes("401") || message.includes("x-api-key");
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Something went wrong</h2>
      {isApiKey ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
          API key not found. Add{" "}
          <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1 rounded">ANTHROPIC_API_KEY</code>{" "}
          to your <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1 rounded">.env.local</code>{" "}
          file and restart the dev server.
        </p>
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm font-mono text-xs">{message}</p>
      )}
      <Btn onClick={onRetry} variant="secondary">
        Try again
      </Btn>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TopicView() {
  const topicTask = useStore((s) => s.topicTask);
  const completedTaskIds = useStore((s) => s.completedTaskIds);
  const closeTopic = useStore((s) => s.closeTopic);
  const toggleTask = useStore((s) => s.toggleTask);

  const { streamAI, askAI } = useClaude();
  const [phase, setPhase] = useState<SessionPhase>({ name: "choice" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const { task, curriculum } = (() => {
    for (const c of CURRICULUMS) {
      for (const p of c.phases) {
        for (const t of p.tasks) {
          if (t.id === topicTask?.taskId) return { task: t, curriculum: c };
        }
      }
    }
    return { task: null, curriculum: null };
  })();

  if (!task || !curriculum) {
    closeTopic();
    return null;
  }

  const isCompleted = !!completedTaskIds[task.id];

  function newAbort() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    return ctrl;
  }

  async function loadMaterial(assessmentContext?: string) {
    const ctrl = newAbort();
    setPhase({ name: "loading", stream: "" });

    const userMsg = assessmentContext
      ? `Create a study session for: "${task!.title}"\nCurriculum: ${curriculum!.name}\n\nAssessment context: ${assessmentContext}`
      : `Create a study session for: "${task!.title}"\nCurriculum: ${curriculum!.name}`;

    try {
      const text = await streamAI(
        MATERIAL_SYSTEM,
        userMsg,
        (acc) => {
          if (!ctrl.signal.aborted) setPhase({ name: "loading", stream: acc });
        },
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;
      const material = parseMaterial(text);
      if (material.parts.length === 0) throw new Error("AI returned no study parts. Please try again.");
      setPhase({
        name: "part",
        material,
        partIdx: 0,
        step: "study",
        userText: "",
        feedback: "",
        feedbackStreaming: false,
      });
    } catch (err) {
      if (!ctrl.signal.aborted) setPhase({ name: "error", message: String(err) });
    }
  }

  async function startAssessment() {
    const ctrl = newAbort();
    setPhase({ name: "assessing", status: "loading", questions: [], answers: {}, evalStream: "" });
    try {
      const text = await askAI(
        ASSESSMENT_SYSTEM,
        `Topic: "${task!.title}"\nCurriculum: ${curriculum!.name}`,
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;
      const { questions } = parseJSON<{ questions: string[] }>(text);
      setPhase({ name: "assessing", status: "answering", questions, answers: {}, evalStream: "" });
    } catch (err) {
      if (!ctrl.signal.aborted) setPhase({ name: "error", message: String(err) });
    }
  }

  async function submitAssessment(questions: string[], answers: Record<number, string>) {
    const ctrl = newAbort();
    setPhase({ name: "assessing", status: "evaluating", questions, answers, evalStream: "" });

    const qa = questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] ?? "(no answer)"}`).join("\n\n");

    try {
      const evalText = await streamAI(
        ASSESSMENT_EVAL_SYSTEM,
        `Topic: "${task!.title}"\n\nAssessment:\n${qa}`,
        (acc) => {
          if (!ctrl.signal.aborted)
            setPhase({ name: "assessing", status: "evaluating", questions, answers, evalStream: acc });
        },
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;
      const { summary, gaps } = parseJSON<{ summary: string; gaps: string[] }>(evalText);
      const context =
        gaps.length > 0
          ? `Learner level: ${summary}. Key gaps to focus on: ${gaps.join(", ")}.`
          : `Learner level: ${summary}. Knowledge is solid — go deep and cover advanced nuances.`;
      await loadMaterial(context);
    } catch (err) {
      if (!ctrl.signal.aborted) setPhase({ name: "error", message: String(err) });
    }
  }

  async function submitWriteUp(partIdx: number, material: Material, text: string) {
    const ctrl = newAbort();
    const part = material.parts[partIdx]!;
    setPhase({
      name: "part",
      material,
      partIdx,
      step: "write-up",
      userText: text,
      feedback: "",
      feedbackStreaming: true,
    });
    try {
      await streamAI(
        WRITEUP_SYSTEM,
        `Topic: "${part.title}"\nLearner's reflection: "${text}"`,
        (acc) => {
          if (!ctrl.signal.aborted) {
            setPhase({
              name: "part",
              material,
              partIdx,
              step: "write-up",
              userText: text,
              feedback: acc,
              feedbackStreaming: true,
            });
          }
        },
        ctrl.signal,
      );
      if (!ctrl.signal.aborted) {
        setPhase((prev) => (prev.name === "part" ? { ...prev, feedbackStreaming: false } : prev));
      }
    } catch (err) {
      if (!ctrl.signal.aborted) setPhase({ name: "error", message: String(err) });
    }
  }

  async function submitFinalTest(material: Material, answers: Record<number, string>) {
    const ctrl = newAbort();
    setPhase({ name: "final-test", material, answers, grading: "", gradingDone: false, passed: false });

    const qa = material.finalTest
      .map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${answers[i] ?? "(no answer)"}`)
      .join("\n\n");

    try {
      const gradingText = await streamAI(
        GRADING_SYSTEM,
        `Topic: "${task!.title}"\n\nTest answers:\n${qa}`,
        (acc) => {
          if (!ctrl.signal.aborted) {
            setPhase({ name: "final-test", material, answers, grading: acc, gradingDone: false, passed: false });
          }
        },
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;
      const { passed, feedback } = parseJSON<{ score: number; passed: boolean; feedback: string }>(gradingText);
      if (passed && !isCompleted) toggleTask(task!.id);
      setPhase({ name: "final-test", material, answers, grading: feedback, gradingDone: true, passed });
    } catch (err) {
      if (!ctrl.signal.aborted) setPhase({ name: "error", message: String(err) });
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <header className="flex items-start gap-4 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={closeTopic}
          className="mt-0.5 shrink-0 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          ← Back
        </button>
        <div className="min-w-0">
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">{curriculum.name}</div>
          <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">{task.title}</h1>
        </div>
        {isCompleted && (
          <span className="ml-auto shrink-0 text-xs text-green-600 dark:text-green-400 font-medium">✓ Completed</span>
        )}
      </header>

      {/* Content */}
      {phase.name === "choice" && <ChoiceSection onScratch={() => loadMaterial()} onAssess={() => startAssessment()} />}
      {phase.name === "assessing" && (
        <AssessmentSection
          phase={phase}
          onAnswerChange={(idx, text) =>
            setPhase((prev) =>
              prev.name === "assessing" ? { ...prev, answers: { ...prev.answers, [idx]: text } } : prev,
            )
          }
          onSubmit={() => {
            if (phase.name === "assessing") submitAssessment(phase.questions, phase.answers);
          }}
        />
      )}
      {phase.name === "loading" && <LoadingSection stream={phase.stream} />}
      {phase.name === "part" && (
        <PartSection
          phase={phase}
          onUpdateText={(text) => setPhase((prev) => (prev.name === "part" ? { ...prev, userText: text } : prev))}
          onNextStep={() =>
            setPhase((prev) => {
              if (prev.name !== "part") return prev;
              if (prev.step === "study") return { ...prev, step: "hands-on", userText: "" };
              if (prev.step === "hands-on") return { ...prev, step: "write-up", userText: "", feedback: "" };
              return prev;
            })
          }
          onSubmitWriteUp={() => {
            if (phase.name === "part") submitWriteUp(phase.partIdx, phase.material, phase.userText);
          }}
          onNextPart={() =>
            setPhase((prev) => {
              if (prev.name !== "part") return prev;
              const nextIdx = prev.partIdx + 1;
              if (nextIdx < prev.material.parts.length) {
                return {
                  ...prev,
                  partIdx: nextIdx,
                  step: "study",
                  userText: "",
                  feedback: "",
                  feedbackStreaming: false,
                };
              }
              return {
                name: "final-test",
                material: prev.material,
                answers: {},
                grading: "",
                gradingDone: false,
                passed: false,
              };
            })
          }
        />
      )}
      {phase.name === "final-test" && (
        <FinalTestSection
          phase={phase}
          onAnswerChange={(idx, text) =>
            setPhase((prev) =>
              prev.name === "final-test" ? { ...prev, answers: { ...prev.answers, [idx]: text } } : prev,
            )
          }
          onSubmit={() => {
            if (phase.name === "final-test") submitFinalTest(phase.material, phase.answers);
          }}
          onComplete={() =>
            setPhase((prev) =>
              prev.name === "final-test" ? (prev.passed ? { name: "complete" } : { name: "choice" }) : prev,
            )
          }
        />
      )}
      {phase.name === "complete" && <CompleteSection taskTitle={task.title} onBack={closeTopic} />}
      {phase.name === "error" && <ErrorSection message={phase.message} onRetry={() => setPhase({ name: "choice" })} />}
    </div>
  );
}
