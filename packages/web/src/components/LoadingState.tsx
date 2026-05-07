import type { ReactNode } from "react";
import { DotLoader } from "./Spinner";

export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div className="flex grow self-stretch min-h-[60vh] items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground text-center">
        <DotLoader />
        {children}
      </div>
    </div>
  );
}
