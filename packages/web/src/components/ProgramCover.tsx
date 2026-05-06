import type { GrainGradientProps } from "@paper-design/shaders-react";
import { GradientBackground } from "./GradientBg";

import type { GradientCover } from "~/lib/gradient";

export function ProgramCover({ cover, shape = "blob" }: { cover: GradientCover; shape?: GrainGradientProps["shape"] }) {
  return <GradientBackground preset={cover} shape={shape} speed={0} />;
}
