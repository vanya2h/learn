import { GrainGradient, GrainGradientProps } from "@paper-design/shaders-react";
import { GridBackground } from "./GridBg";

import { useTheme } from "~/hooks/useTheme";
import type { GradientCover, GradientPreset } from "~/lib/gradient";
import { cn } from "~/lib/utils";

export type GradientBackgroundProps = React.ComponentProps<"div"> & {
  preset: GradientPreset | GradientCover;
  shape?: GrainGradientProps["shape"];
  speed?: number;
};

export function GradientBackground({ preset, shape, speed = 1, className, ...restProps }: GradientBackgroundProps) {
  const { theme } = useTheme();
  return (
    <div className={cn("absolute inset-0", className)} {...restProps}>
      <GrainGradient
        style={{ width: "100%", height: "100%" }}
        shape={shape ?? preset.shape}
        colors={[...preset.colors]}
        rotation={preset.rotation}
        colorBack={theme === "dark" ? "#0e0b0c" : "#fff"}
        softness={0.76}
        intensity={0.5}
        noise={0}
        scale={1.5}
        speed={speed}
      />
      <GridBackground />
    </div>
  );
}
