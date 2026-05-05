import { Trans } from "@lingui/react/macro";
import { Button } from "./ui/Button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="px-6 py-3 flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-4 min-w-0">
          <span className="whitespace-nowrap">
            <Trans>© {currentYear} Learning Tracker</Trans>
          </span>
          <span className="whitespace-nowrap">
            <Trans>Beta</Trans>
          </span>
        </div>
        <a href="mailto:hi@vanya2h.me">
          <Button variant="secondary">
            <Trans>Send feedback</Trans>
          </Button>
        </a>
      </div>
    </footer>
  );
}
