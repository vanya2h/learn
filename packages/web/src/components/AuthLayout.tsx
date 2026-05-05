import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { GridBackground } from "./GridBg";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative max-w-360 mx-auto border-x border-border min-h-screen flex flex-col">
      <GridBackground />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8 p-6">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
