import { useState } from "react";
import { generateGradient } from "../../lib/gradient";
import { ProgramCover } from "../ProgramCover";
import { BuilderContent } from "./BuilderContent";
import { BuilderSidebar } from "./BuilderSidebar";
import { useCurriculumBuilder } from "./useCurriculumBuilder";

export function CurriculumBuilder() {
  const builder = useCurriculumBuilder();
  const [cover] = useState(generateGradient);

  return (
    <div className="flex flex-1">
      <BuilderSidebar step={builder.step} />
      <div className="flex-1 min-w-0 border-l border-border flex flex-col relative">
        <div className="absolute inset-0">
          <ProgramCover shape="wave" cover={cover} />
        </div>
        <div className="relative grow backdrop-blur-xl bg-background/90 flex flex-col">
          <BuilderContent {...builder} />
        </div>
      </div>
    </div>
  );
}
