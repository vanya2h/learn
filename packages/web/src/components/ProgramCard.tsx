import { useLingui } from "@lingui/react/macro";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { type ReactNode, useState } from "react";
import { Link, type LinkProps } from "react-router";
import type { CurriculumDef } from "../data/types";

import { cn } from "~/lib/utils";

export type ProgramCardProps = Omit<LinkProps, "to"> & {
  curriculum: CurriculumDef;
  progress: number;
};

export function ProgramCard({ curriculum, progress, className, ...restProps }: ProgramCardProps) {
  const { t } = useLingui();
  const { coverImage, complexity, name, description, id } = curriculum;

  const art = (
    <>
      {coverImage && (
        <img
          src={coverImage}
          alt=""
          aria-hidden
          className="pointer-events-none hidden dark:block absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-20"
        />
      )}
      {coverImage ? (
        <img
          src={coverImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-600 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/60" />
      {complexity && (
        <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-black/55 text-white backdrop-blur-sm">
          {complexity}
        </span>
      )}
    </>
  );

  const extra = (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>{t`Progress`}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-0.5 bg-foreground/10">
        <div
          className="h-full bg-foreground transition-[width] duration-600 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  return (
    <CardShell
      to={`/curriculum/${id}`}
      art={art}
      title={name}
      description={description}
      extra={extra}
      className={className}
      {...restProps}
    />
  );
}

export type CreatePersonalProgramCardProps = Omit<LinkProps, "to" | "children">;

export function CreatePersonalProgramCard({ className, ...restProps }: CreatePersonalProgramCardProps) {
  const { t } = useLingui();

  return (
    <CardShell
      to="/curriculum/new"
      art={<ConstellationArt />}
      title={t`Create personal program`}
      description={t`Design your own path. Pick a topic, set the depth, and start building skills.`}
      className={className}
      {...restProps}
    />
  );
}

type CardShellProps = Omit<LinkProps, "to" | "children"> & {
  to: string;
  art: ReactNode;
  title: string;
  description?: string;
  extra?: ReactNode;
};

function CardShell({ to, art, title, description, extra, className, ...restProps }: CardShellProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className={cn(
        "group relative block aspect-video overflow-hidden bg-foreground/2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/30",
        className,
      )}
      {...restProps}
    >
      <div className="absolute inset-0 overflow-hidden">{art}</div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 p-4 border-t border-border bg-background-layer/90 backdrop-blur-md",
          "transition-transform duration-460",
          hover ? "translate-y-0" : "translate-y-[calc(100%-3.5625rem)]",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}
      >
        <div className="flex items-center justify-between gap-3 min-h-6">
          <h3 className="min-w-0 truncate text-base font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
          <Arrow hover={hover} />
        </div>

        <div
          className="mt-3 flex flex-col gap-3 transition-opacity duration-480"
          style={{
            opacity: hover ? 1 : 0,
            transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)",
            transitionDelay: hover ? "60ms" : "0ms",
          }}
        >
          {description && (
            <p className="text-[13px] leading-normal text-muted-foreground line-clamp-2">{description}</p>
          )}
          {extra}
        </div>
      </div>
    </Link>
  );
}

function Arrow({ hover }: { hover: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 grid place-items-center w-6 h-6 rounded-full border border-border",
        "transition-[transform,background-color] duration-420",
        hover ? "translate-x-0.5 -rotate-45 bg-foreground/4" : "translate-x-0 rotate-0 bg-transparent",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}
      aria-hidden
    >
      <ArrowRightIcon size={12} weight="bold" className="text-foreground" />
    </span>
  );
}

function ConstellationArt() {
  return (
    <div className="absolute inset-0 text-foreground mb-14">
      <svg className="absolute inset-0 w-full h-full" aria-hidden>
        <rect width="100%" height="100%" fill="url(#cpc-dots)" />
        <rect width="100%" height="100%" fill="url(#cpc-vig)" />
      </svg>

      <svg
        viewBox="0 0 410 220"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <g
          className="origin-[205px_110px] transition-transform duration-700 group-hover:scale-[1.06]"
          style={{ transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)" }}
        >
          <g
            fill="none"
            strokeWidth="1"
            className="stroke-foreground/20 transition-[stroke] duration-600 group-hover:stroke-foreground/40"
          >
            <line x1="120" y1="70" x2="200" y2="110" />
            <line x1="200" y1="110" x2="285" y2="80" />
            <line x1="200" y1="110" x2="170" y2="170" />
            <line x1="200" y1="110" x2="265" y2="160" />
            <line x1="285" y1="80" x2="320" y2="135" />
          </g>
          <g fill="currentColor">
            <circle cx="120" cy="70" r="3" />
            <circle cx="285" cy="80" r="3" />
            <circle cx="170" cy="170" r="3" />
            <circle cx="265" cy="160" r="3" />
            <circle cx="320" cy="135" r="3" />
            <circle cx="200" cy="110" r="9" fill="none" stroke="currentColor" strokeOpacity="0.4" />
            <circle cx="200" cy="110" r="5" />
            <circle
              cx="200"
              cy="110"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.2"
              className="opacity-50 transition-all duration-700 group-hover:[r:22] group-hover:opacity-90"
            />
            <circle
              cx="200"
              cy="110"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.1"
              className="opacity-0 transition-all duration-900 group-hover:[r:34] group-hover:opacity-70"
            />
          </g>
        </g>
      </svg>

      <div className="absolute left-4 top-3.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">
        New
      </div>
    </div>
  );
}
