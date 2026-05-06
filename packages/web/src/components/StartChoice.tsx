import * as React from "react";

/**
 * StartChoice — "How do you want to start?" decision surface.
 *
 * Two cards, each with a small diagram of its actual path:
 *   • Quick assessment  → 4 questions converging into an AI/gaps hub (loop)
 *   • Start from scratch → 8-stage linear progression
 *
 * The first card is rendered as the recommended/accent option.
 *
 * Drop-in usage:
 *   <StartChoice
 *     onAssess={() => router.push('/assess')}
 *     onLinear={() => router.push('/study')}
 *   />
 *
 * Tokens (color, fonts) live in CHOICE_TOKENS at the bottom of the file
 * — override individually via the `tokens` prop or restyle wholesale.
 */

export type StartChoiceTokens = {
  accent: string;
  fg: string;
  fgDim: string;
  fgFaint: string;
  hairline: string;
  surface: string;
  fontSans: string;
  fontMono: string;
};

export const CHOICE_TOKENS: StartChoiceTokens = {
  accent: "#c8ff5a",
  fg: "rgba(255,255,255,0.92)",
  fgDim: "rgba(255,255,255,0.5)",
  fgFaint: "rgba(255,255,255,0.28)",
  hairline: "rgba(255,255,255,0.08)",
  surface: "#0d0d0d",
  fontSans: '-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontMono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

export type StartChoiceCopy = {
  heading?: string;
  subheading?: string;
  assess: {
    eyebrow: string;
    title: string;
    body: string;
    meta: string;
  };
  linear: {
    eyebrow: string;
    title: string;
    body: string;
    meta: string;
  };
};

export const DEFAULT_COPY: StartChoiceCopy = {
  heading: "How do you want to start?",
  subheading: "Take a quick test to surface gaps and personalize the material, or dive straight in from the beginning.",
  assess: {
    eyebrow: "01 · Assessment route",
    title: "Quick assessment first",
    body: "Answer 4 questions so the AI can focus on your gaps",
    meta: "~3 min · personalized",
  },
  linear: {
    eyebrow: "02 · Linear route",
    title: "Start from scratch",
    body: "Full comprehensive material from the beginning",
    meta: "Full path · 8 stages",
  },
};

export type StartChoiceProps = {
  onAssess?: () => void;
  onLinear?: () => void;
  /** Hide the "How do you want to start?" header above the cards. */
  hideHeader?: boolean;
  /** Override copy. Partial override is fine — falls back to DEFAULT_COPY. */
  copy?: Partial<StartChoiceCopy> & {
    assess?: Partial<StartChoiceCopy["assess"]>;
    linear?: Partial<StartChoiceCopy["linear"]>;
  };
  /** Override design tokens (colors, fonts). */
  tokens?: Partial<StartChoiceTokens>;
  /** Number of stages drawn in the linear diagram. Default 8. */
  linearStages?: number;
  /** Number of questions drawn in the loop diagram. Default 4. */
  assessQuestions?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function StartChoice({
  onAssess,
  onLinear,
  hideHeader = false,
  copy,
  tokens,
  linearStages = 8,
  assessQuestions = 4,
  className,
  style,
}: StartChoiceProps) {
  const t = { ...CHOICE_TOKENS, ...tokens };
  const c: StartChoiceCopy = {
    ...DEFAULT_COPY,
    ...copy,
    assess: { ...DEFAULT_COPY.assess, ...(copy?.assess ?? {}) },
    linear: { ...DEFAULT_COPY.linear, ...(copy?.linear ?? {}) },
  };

  return (
    <div
      className={className}
      style={{
        width: "100%",
        maxWidth: 880,
        margin: "0 auto",
        fontFamily: t.fontSans,
        color: t.fg,
        ...style,
      }}
    >
      {!hideHeader && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 56,
            maxWidth: 520,
            marginInline: "auto",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: -0.6,
              color: t.fg,
            }}
          >
            {c.heading}
          </div>
          <div
            style={{
              fontSize: 14,
              color: t.fgDim,
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            {c.subheading}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 20 }}>
        <ChoiceCard
          tokens={t}
          accent
          eyebrow={c.assess.eyebrow}
          title={c.assess.title}
          body={c.assess.body}
          meta={c.assess.meta}
          onClick={onAssess}
          diagram={<LoopDiagram tokens={t} count={assessQuestions} />}
        />
        <ChoiceCard
          tokens={t}
          eyebrow={c.linear.eyebrow}
          title={c.linear.title}
          body={c.linear.body}
          meta={c.linear.meta}
          onClick={onLinear}
          diagram={<LineDiagram tokens={t} count={linearStages} />}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type ChoiceCardProps = {
  tokens: StartChoiceTokens;
  eyebrow: string;
  title: string;
  body: string;
  meta: string;
  diagram: React.ReactNode;
  accent?: boolean;
  onClick?: () => void;
};

function ChoiceCard({ tokens: t, eyebrow, title, body, meta, diagram, accent, onClick }: ChoiceCardProps) {
  const [hover, setHover] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        all: "unset",
        flex: 1,
        cursor: "pointer",
        borderRadius: 14,
        background: accent ? `linear-gradient(180deg, ${t.accent}0d, transparent 60%), ${t.surface}` : t.surface,
        border: `1px solid ${accent ? `${t.accent}33` : t.hairline}`,
        overflow: "hidden",
        transition: "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
        transform: hover ? "translateY(-2px)" : "none",
        borderColor: hover
          ? accent
            ? `${t.accent}88`
            : "rgba(255,255,255,0.2)"
          : accent
            ? `${t.accent}33`
            : t.hairline,
        boxShadow: hover && accent ? `0 24px 60px -28px ${t.accent}55` : "none",
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
      }}
      aria-label={title}
    >
      <div
        style={{
          height: 140,
          borderBottom: `1px solid ${t.hairline}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03), transparent 70%)",
        }}
      >
        {diagram}
      </div>

      <div style={{ padding: 24 }}>
        <div
          style={{
            fontFamily: t.fontMono,
            fontSize: 10,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: accent ? t.accent : t.fgFaint,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: -0.4,
            marginTop: 14,
            color: t.fg,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: t.fgDim,
            marginTop: 8,
            lineHeight: 1.55,
          }}
        >
          {body}
        </div>
        <div
          style={{
            marginTop: 20,
            paddingTop: 14,
            borderTop: `1px solid ${t.hairline}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: t.fontMono,
            fontSize: 11,
            color: t.fgFaint,
            letterSpacing: 0.4,
          }}
        >
          <span>{meta}</span>
          <span
            style={{
              color: accent ? t.accent : t.fgDim,
              transition: "transform .2s",
              transform: hover ? "translateX(3px)" : "none",
            }}
          >
            ↗
          </span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagrams

function LoopDiagram({ tokens: t, count = 4 }: { tokens: StartChoiceTokens; count?: number }) {
  const W = 220;
  const H = 100;
  const cy = 50;
  const cx = W / 2;
  // distribute question dots across the row, skipping the centre
  const positions = Array.from({ length: count }).map((_, i) => {
    const t2 = (i + 0.5) / count; // 0..1
    return Math.round(20 + t2 * (W - 40));
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="sc-hub" cx="50%" cy="50%">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.6" />
          <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {positions.map((x, i) => {
        const onLeft = x < cx;
        return (
          <g key={i}>
            <circle cx={x} cy={cy} r={3} fill={i < count / 2 ? t.accent : t.fgFaint} />
            <text
              x={x}
              y={cy + 28}
              fontFamily={t.fontMono}
              fontSize="9"
              fill="rgba(255,255,255,0.35)"
              textAnchor="middle"
            >
              Q{i + 1}
            </text>
            <path
              d={`M${x + (onLeft ? 3 : -3)} ${cy} L${cx + (onLeft ? -10 : 10)} ${cy}`}
              stroke={onLeft ? t.accent : "rgba(255,255,255,0.2)"}
              strokeWidth="1"
              strokeDasharray="2 3"
            />
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="28" fill="url(#sc-hub)" />
      <circle cx={cx} cy={cy} r="10" fill="none" stroke={t.accent} strokeWidth="1" />
      <circle cx={cx} cy={cy} r="3" fill={t.accent} />
      <text
        x={cx}
        y={cy - 28}
        fontFamily={t.fontMono}
        fontSize="9"
        fill={t.accent}
        textAnchor="middle"
        letterSpacing="1.4"
      >
        AI · GAPS
      </text>
    </svg>
  );
}

function LineDiagram({ tokens: t, count = 8 }: { tokens: StartChoiceTokens; count?: number }) {
  const W = 240;
  const H = 100;
  const cy = 50;
  const startX = 20;
  const endX = 220;
  const step = count > 1 ? (endX - startX) / (count - 1) : 0;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true">
      <line x1={startX} y1={cy} x2={endX} y2={cy} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      {Array.from({ length: count }).map((_, i) => {
        const x = startX + i * step;
        const isFirst = i === 0;
        return (
          <g key={i}>
            <circle cx={x} cy={cy} r={isFirst ? 4 : 2.5} fill={isFirst ? t.fg : "rgba(255,255,255,0.4)"} />
            <text
              x={x}
              y={cy + 28}
              fontFamily={t.fontMono}
              fontSize="9"
              fill="rgba(255,255,255,0.3)"
              textAnchor="middle"
            >
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
      <text
        x={W / 2}
        y={cy - 28}
        fontFamily={t.fontMono}
        fontSize="9"
        fill="rgba(255,255,255,0.5)"
        textAnchor="middle"
        letterSpacing="1.4"
      >
        START → FINISH
      </text>
    </svg>
  );
}

export default StartChoice;
