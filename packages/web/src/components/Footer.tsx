import { Trans } from "@lingui/react/macro";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { Inset } from "./layout/Inset";
import { LanguageSwitcher } from "./LanguageSwitcher";

import { Button } from "~/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <Inset className="py-3 flex flex-col gap-3 sm:flex-row sm:justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4 min-w-0 justify-between sm:justify-start">
          <span className="whitespace-nowrap">
            <Trans>© {currentYear} Sheafu</Trans>
          </span>
          <span className="whitespace-nowrap">
            <Trans>Beta</Trans>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-start">
          <div className="flex flex-row gap-2">
            <LanguageSwitcher />
            <Button
              variant="secondary"
              size="icon"
              render={
                <a
                  href="https://github.com/vanya2h/learn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                />
              }
            >
              <GithubLogoIcon />
            </Button>
          </div>
          <Button variant="secondary" render={<a href="mailto:hi@vanya2h.me" />}>
            <Trans>Send feedback</Trans>
          </Button>
        </div>
      </Inset>
    </footer>
  );
}
