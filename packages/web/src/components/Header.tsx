import { Trans } from "@lingui/react/macro";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Fragment, useEffect, useState } from "react";
import { Link, useMatches, useNavigate } from "react-router";
import { useRootData } from "../../app/hooks/useRootData";
import { useTheme } from "../hooks/useTheme";
import { authClient } from "../lib/authClient";
import type { BreadcrumbHandle } from "../lib/breadcrumbs";
import type { AuthUser } from "../server/auth";
import { Breadcrumbs } from "./ui/Breadcrumbs";
import { Menu } from "./ui/Menu";
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
  const { toggle, theme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const matches = useMatches();
  const crumbs = matches
    .map((m) => (m.handle as BreadcrumbHandle | undefined)?.breadcrumb)
    .filter((b): b is BreadcrumbHandle["breadcrumb"] => typeof b === "function");

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 border-b border-border transition-colors duration-200",
        scrolled ? "bg-background/50 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="shrink-0">
            <h1 className="text-lg font-semibold leading-none">
              <Link to="/" className="text-foreground hover:opacity-75 transition-opacity whitespace-nowrap">
                <Trans>Learning Tracker</Trans>
              </Link>
            </h1>
          </div>
          {crumbs.length > 0 && (
            <Breadcrumbs.Root>
              {crumbs.map((crumb, i) => (
                <Fragment key={i}>
                  <Breadcrumbs.Separator />
                  {crumb()}
                </Fragment>
              ))}
            </Breadcrumbs.Root>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
          <Link
            to="/curriculum/new"
            className="inline-flex items-center justify-center h-9 px-3.5 text-sm font-medium bg-foreground text-background hover:opacity-90 transition-colors"
          >
            <Trans>New program</Trans>
          </Link>
          <LanguageSwitcher />
          {user && (
            <Menu.Root>
              <Menu.Trigger
                render={<button className="rounded-full focus:outline-none focus:ring-2 focus:ring-foreground/40" />}
              >
                <UserAvatar user={user} />
              </Menu.Trigger>
              <Menu.Popup>
                <Menu.Group>
                  <Menu.GroupLabel>
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </Menu.GroupLabel>
                </Menu.Group>
                <Menu.Separator />
                <Menu.Item onClick={toggle}>
                  {theme === "dark" ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                  <Trans>Toggle theme</Trans>
                </Menu.Item>
                <Menu.Item onClick={() => authClient.signOut().then(() => navigate("/sign-in"))}>
                  <Trans>Sign out</Trans>
                </Menu.Item>
              </Menu.Popup>
            </Menu.Root>
          )}
        </div>
      </div>
    </header>
  );
}
