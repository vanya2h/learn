import type { ReactNode } from "react";
import { DotLoader } from "./Spinner";

export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted-foreground text-center">
      <DotLoader />
      {children}
    </div>
  );
}
