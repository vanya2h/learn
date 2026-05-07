import { useState } from "react";
import { generateGradient } from "../../lib/gradient";
import { GridBackground } from "../GridBg";
import { ProgramCover } from "../ProgramCover";
import { BuilderActionBarSlotContext } from "./BuilderActionBar";
import { BuilderContent } from "./BuilderContent";
import { BuilderSidebar } from "./BuilderSidebar";
import { useCurriculumBuilder } from "./useCurriculumBuilder";

export function CurriculumBuilder() {
  const builder = useCurriculumBuilder();
  const [cover] = useState(generateGradient);
  const [actionBarSlot, setActionBarSlot] = useState<HTMLElement | null>(null);

  return (
    <BuilderActionBarSlotContext value={actionBarSlot}>
      <div className="flex flex-1">
        <BuilderSidebar step={builder.step} />
        <div className="flex-1 min-w-0 border-l border-border flex flex-col relative">
          <div className="absolute inset-0">
            <ProgramCover shape="wave" preset={cover} />
          </div>
          <div className="relative grow bg-background/80 flex flex-col">
            <GridBackground />
            <div className="flex-1 flex flex-col">
              <BuilderContent {...builder} />
            </div>
            <div ref={setActionBarSlot} className="sticky bottom-0 z-10 shrink-0" />
          </div>
        </div>
      </div>
    </BuilderActionBarSlotContext>
  );
}
