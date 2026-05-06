import { Trans, useLingui } from "@lingui/react/macro";
import { CardShell } from "../../src/components/ProgramCard";

import { cn } from "~/lib/utils";

export default function ChoicePage() {
  const { t } = useLingui();

  return (
    <section>
      <div className="max-w-240 mx-auto">
        <div className="text-center mt-[10vh]">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            <Trans>How do you want to start?</Trans>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            <Trans>
              Take a quick test to surface gaps and personalize the material, or dive straight in from the beginning.
            </Trans>
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2">
          <CardShell
            to="../assess"
            relative="path"
            art={<LoopArt label={t`01 · Assessment route`} />}
            title={t`Quick assessment first`}
            description={t`Answer 4 questions so the AI can focus on your gaps`}
            extra={<Meta>{t`~3 min · personalized`}</Meta>}
            className="border-b border-border md:border-b-0 md:border-r"
          />
          <CardShell
            to="../study"
            relative="path"
            art={<LineArt label={t`02 · Linear route`} />}
            title={t`Start from scratch`}
            description={t`Full comprehensive material from the beginning`}
            extra={<Meta>{t`Full path · 8 stages`}</Meta>}
          />
        </div>
      </div>
    </section>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{children}</div>;
}

function ArtFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 mb-14 text-foreground">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="100%" height="100%" className="fill-foreground/2" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
      <div className="absolute left-4 top-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function LoopArt({ label }: { label: string }) {
  const count = 4;
  const W = 320;
  const H = 160;
  const cy = H / 2;
  const cx = W / 2;
  const positions = Array.from({ length: count }).map((_, i) => {
    const u = (i + 0.5) / count;
    return Math.round(40 + u * (W - 80));
  });

  return (
    <ArtFrame label={label}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <g
          className={cn(
            "origin-center transition-transform duration-700 group-hover:scale-[1.06]",
            "ease-[cubic-bezier(.2,.8,.2,1)]",
          )}
        >
          {positions.map((x, i) => {
            const onLeft = x < cx;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={cy}
                  r={3}
                  fill="currentColor"
                  className={i < count / 2 ? "text-foreground" : "text-foreground/40"}
                />
                <path
                  d={`M${x + (onLeft ? 3 : -3)} ${cy} L${cx + (onLeft ? -14 : 14)} ${cy}`}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  className={cn(
                    "transition-[stroke] duration-600",
                    onLeft ? "text-foreground/70 group-hover:text-foreground" : "text-foreground/20",
                  )}
                />
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r="12" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <circle cx={cx} cy={cy} r="5" fill="currentColor" />
          <circle
            cx={cx}
            cy={cy}
            r="18"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.2"
            className="opacity-60 transition-all duration-700 group-hover:[r:28] group-hover:opacity-90"
          />
          <circle
            cx={cx}
            cy={cy}
            r="22"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.1"
            className="opacity-0 transition-all duration-900 group-hover:[r:42] group-hover:opacity-70"
          />
        </g>
      </svg>
    </ArtFrame>
  );
}

function LineArt({ label }: { label: string }) {
  const count = 8;
  const W = 360;
  const H = 160;
  const cy = H / 2;
  const startX = 30;
  const endX = W - 30;
  const step = (endX - startX) / (count - 1);

  return (
    <ArtFrame label={label}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <g
          className={cn(
            "origin-center transition-transform duration-700 group-hover:scale-[1.04]",
            "ease-[cubic-bezier(.2,.8,.2,1)]",
          )}
        >
          <line
            x1={startX}
            y1={cy}
            x2={endX}
            y2={cy}
            stroke="currentColor"
            strokeWidth="1"
            className="text-foreground/20"
          />
          {Array.from({ length: count }).map((_, i) => {
            const x = startX + i * step;
            const isFirst = i === 0;
            return (
              <circle
                key={i}
                cx={x}
                cy={cy}
                r={isFirst ? 4 : 2.5}
                fill="currentColor"
                className={cn(
                  "transition-[fill] duration-600",
                  isFirst ? "text-foreground" : "text-foreground/40 group-hover:text-foreground/70",
                )}
              />
            );
          })}
        </g>
      </svg>
    </ArtFrame>
  );
}
