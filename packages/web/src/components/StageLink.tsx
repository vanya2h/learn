import clsx from "clsx";
import type { ReactNode } from "react";
import { Link } from "react-router";

type Props = {
  prefix: ReactNode;
  label: ReactNode;
  to?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
};

const BASE = "flex items-center gap-3 px-5 py-4 border-b border-border";

export function StageLink({ prefix, label, to, onClick, active, disabled }: Props) {
  const inner = (
    <>
      <span className="flex items-center w-8 shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/40">
        {prefix}
      </span>
      <span className="text-sm font-medium truncate">{label}</span>
    </>
  );

  if (disabled) {
    return (
      <div className={clsx(BASE, "text-foreground/30 cursor-not-allowed select-none")} aria-disabled>
        {inner}
      </div>
    );
  }

  const interactive = clsx(
    BASE,
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/30",
    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
  );

  if (to) {
    return (
      <Link to={to} className={interactive}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={clsx(interactive, "w-full text-left cursor-pointer")}>
      {inner}
    </button>
  );
}
