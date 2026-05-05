import { useLingui } from "@lingui/react/macro";
import clsx from "clsx";
import { Link } from "react-router";
import type { CurriculumDef } from "../data/types";
import { Meter } from "./ui/Meter";

type Props = {
  curriculum: CurriculumDef;
  progress: number;
  className?: string;
};

export function ProgramCard({ curriculum, progress, className }: Props) {
  const { t } = useLingui();
  const { coverImage, complexity, name, description, id } = curriculum;

  return (
    <Link
      to={`/curriculum/${id}`}
      className={clsx(
        "group relative flex flex-col bg-background overflow-hidden",
        "transition-colors duration-300 hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/30",
        className,
      )}
    >
      {coverImage ? (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/80" />
          {complexity && (
            <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-black/50 text-white backdrop-blur-sm">
              {complexity}
            </span>
          )}
          <h3 className="absolute bottom-4 left-5 right-5 z-10 text-white text-2xl font-semibold leading-tight">
            {name}
          </h3>
        </div>
      ) : (
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-2xl font-semibold text-foreground leading-tight">{name}</h3>
        </div>
      )}
      <div className="px-6 py-5 flex-1 flex flex-col justify-between gap-5">
        {description && <p className="text-base text-muted-foreground leading-relaxed line-clamp-2">{description}</p>}
        <Meter label={t`Progress`} value={progress} showValue />
      </div>
    </Link>
  );
}
