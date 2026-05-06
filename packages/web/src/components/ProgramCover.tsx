import { GrainGradient, GrainGradientProps } from "@paper-design/shaders-react";

import { useTheme } from "~/hooks/useTheme";
import { GradientCover } from "~/lib/gradient";

export function ProgramCover({ cover, shape = "blob" }: { cover: GradientCover; shape?: GrainGradientProps["shape"] }) {
  const { theme } = useTheme();
  return (
    <GrainGradient
      style={{ width: "100%", height: "100%" }}
      shape={shape}
      rotation={cover.rotation}
      colorBack={theme === "dark" ? "#000" : "#fff"}
      colors={cover.colors}
      softness={0.76}
      intensity={0.5}
      noise={0}
      scale={1.5}
      speed={0}
    />
  );
}
