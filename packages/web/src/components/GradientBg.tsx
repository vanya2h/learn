"use client";

import { GrainGradient } from "@paper-design/shaders-react";

const COMMON = {
  style: { height: "100%", width: "100%" },
  softness: 0.76,
  noise: 0,
  shape: "corners" as const,
  offsetX: 0,
  offsetY: 0,
  scale: 1.5,
  rotation: 0,
  speed: 1,
};

export function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 dark:hidden">
        <GrainGradient {...COMMON} intensity={0.5} colors={["#7300ff", "hsl(14, 100%, 57%)"]} colorBack="#fff" />
      </div>
      <div className="absolute inset-0 hidden dark:block">
        <GrainGradient
          {...COMMON}
          colorBack="hsl(0, 0%, 0%)"
          intensity={0.45}
          colors={["hsl(14, 100%, 57%)", "hsl(45, 100%, 51%)", "hsl(340, 82%, 52%)"]}
        />
      </div>
    </div>
  );
}
