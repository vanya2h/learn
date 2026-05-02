import { Breadcrumbs } from "@cloudflare/kumo/components/breadcrumbs";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Text } from "@cloudflare/kumo/components/text";
import { Trans } from "@lingui/react/macro";
import { MoonIcon } from "@phosphor-icons/react";
import { Fragment } from "react";
import { Link, useMatches, useNavigate } from "react-router";
import { useRootData } from "../../app/hooks/useRootData";
import { useTheme } from "../hooks/useTheme";
import { authClient } from "../lib/authClient";
import type { BreadcrumbHandle } from "../lib/breadcrumbs";
import type { AuthUser } from "../server/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";

function hashToHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
  return h % 360;
}

function UserAvatar({ user }: { user: AuthUser }) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue = hashToHue(user.id);

  if (user.image) {
    return <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />;
  }

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), hsl(${(hue + 60) % 360}, 65%, 40%))`,
      }}
    >
      {initials}
    </div>
  );
}

export function Header() {
  const user = (useRootData()?.user ?? null) as AuthUser | null;
  const { toggle } = useTheme();
  const navigate = useNavigate();

  const matches = useMatches();
  const crumbs = matches
    .map((m) => (m.handle as BreadcrumbHandle | undefined)?.breadcrumb)
    .filter((b): b is BreadcrumbHandle["breadcrumb"] => typeof b === "function");

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border">
      <div className="flex items-center gap-4">
        <Text variant="heading2" as="h1">
          <Link to="/" className="text-foreground hover:opacity-75 transition-opacity">
            <Trans>Learning Tracker</Trans>
          </Link>
        </Text>
        {crumbs.length > 0 && (
          <Breadcrumbs size="sm">
            {crumbs.map((crumb, i) => (
              <Fragment key={i}>
                <Breadcrumbs.Separator />
                {crumb()}
              </Fragment>
            ))}
          </Breadcrumbs>
        )}
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <LanguageSwitcher />
        {user && (
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={<button className="rounded-full focus:outline-none focus:ring-2 focus:ring-foreground/40" />}
            >
              <UserAvatar user={user} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Group>
                <DropdownMenu.Label>
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenu.Label>
              </DropdownMenu.Group>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onClick={toggle}>
                <MoonIcon size={14} />
                <Trans>Toggle theme</Trans>
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => authClient.signOut().then(() => navigate("/sign-in"))}>
                <Trans>Sign out</Trans>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
