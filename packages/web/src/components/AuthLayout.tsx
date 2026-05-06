import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { GradientBackground } from "./GradientBg";

import { useTheme } from "~/hooks/useTheme";
import { GRADIENT_PRESETS } from "~/lib/gradient";

export function AuthLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <div className="relative max-w-360 mx-auto border-x border-border min-h-screen flex flex-col">
      <GradientBackground preset={theme === "dark" ? GRADIENT_PRESETS.heroDark : GRADIENT_PRESETS.heroLight} />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8 p-6">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
