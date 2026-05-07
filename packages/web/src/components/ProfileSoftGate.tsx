import { Trans } from "@lingui/react/macro";
import { ArrowRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { Link } from "react-router";
import { useRootData } from "../../app/hooks/useRootData";
import { getProfileRoute } from "../lib/routes";

export function ProfileSoftGate() {
  const data = useRootData();
  if (!data?.user) return null;
  if (data.onboarding?.hasProfile) return null;

  return (
    <Link
      to={getProfileRoute()}
      className="group flex items-center gap-3 border-b border-border bg-background px-6 py-3 text-sm text-foreground transition-colors"
    >
      <SparkleIcon size={16} className="shrink-0 text-green-400" />
      <p className="flex-1">
        <span className="font-medium">
          <Trans>Upload your CV for a tailored experience.</Trans>
        </span>{" "}
        <span className="text-muted-foreground">
          <Trans>Curriculums, assessments, and explanations all calibrate to what you already know.</Trans>
        </span>
      </p>
      <ArrowRightIcon
        size={14}
        className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
