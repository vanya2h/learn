import { createContext, use, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "~/lib/utils";

export const BuilderActionBarSlotContext = createContext<HTMLElement | null>(null);

export type BuilderActionBarProps = React.ComponentProps<"div">;

export function BuilderActionBar({ className, children, ...restProps }: BuilderActionBarProps) {
  const slot = use(BuilderActionBarSlotContext);
  const stuck = useStuckToBottom(slot);

  if (!slot) return null;
  return createPortal(
    <div
      className={cn("border-t border-border min-h-16 transition-colors", stuck && "bg-background/80 backdrop-blur-md")}
    >
      <div {...restProps} className={cn("max-w-4xl w-full mx-auto px-6 flex items-center gap-3 py-3", className)}>
        {children}
      </div>
    </div>,
    slot,
  );
}

function useStuckToBottom(el: HTMLElement | null) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const parent = el?.parentElement;
    if (!el || !parent) return;

    function check() {
      const elBottom = el!.getBoundingClientRect().bottom;
      const parentBottom = parent!.getBoundingClientRect().bottom;
      setStuck(parentBottom > elBottom + 1);
    }

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [el]);

  return stuck;
}
