import { Trans } from "@lingui/react/macro";
import { DoorOpenIcon, MoonIcon, PlusIcon, SquaresFourIcon, SunIcon, UserIcon } from "@phosphor-icons/react";
import { Fragment, useEffect, useState } from "react";
import { Link, useLocation, useMatches, useNavigate } from "react-router";
import { useRootData } from "../../app/hooks/useRootData";
import { useTheme } from "../hooks/useTheme";
import { authClient } from "../lib/authClient";
import type { BreadcrumbHandle } from "../lib/breadcrumbs";
import { getAuthLinks, getCurriculumLinks, getHomeRoute, getProfileRoute } from "../lib/routes";
import type { AuthUser } from "../server/auth";

import { Breadcrumb, BreadcrumbList, BreadcrumbSeparator } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

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
    return <img src={user.image} alt={user.name} className="size-8 rounded-full object-cover" />;
  }

  return (
    <div
      className="size-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 65%, 55%), hsl(${(hue + 60) % 360}, 65%, 40%))`,
      }}
    >
      {initials}
    </div>
  );
}

export function Header() {
  const root = useRootData();
  const user = (root?.user ?? null) as AuthUser | null;
  const hasDrafts = root?.hasDrafts ?? false;
  const { toggle, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  const signInHref = getAuthLinks().signInWithRedirect(location.pathname + location.search);

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
      className={cn(
        "sticky top-0 z-50 border-b border-border transition-colors duration-200",
        scrolled ? "bg-background/50 backdrop-blur-md" : "bg-background",
      )}
    >
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="shrink-0">
            <h1 className="text-lg sm:text-2xl font-semibold leading-none">
              <Link
                to={getHomeRoute()}
                className="text-foreground hover:opacity-75 transition-opacity whitespace-nowrap"
              >
                <Trans>Learning Tracker</Trans>
              </Link>
            </h1>
          </div>
          {crumbs.length > 0 && (
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                {crumbs.map((crumb, i) => (
                  <Fragment key={i}>
                    <BreadcrumbSeparator />
                    {crumb()}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <Button render={<Link to={getCurriculumLinks().new} />}>
            {hasDrafts ? <SquaresFourIcon className="sm:hidden" /> : <PlusIcon className="sm:hidden" />}
            <span className="hidden sm:inline">
              {hasDrafts ? <Trans>My Programs</Trans> : <Trans>New program</Trans>}
            </span>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<button className="rounded-full focus:outline-none focus:ring-2 focus:ring-foreground/40" />}
              >
                <UserAvatar user={user} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link to={getProfileRoute()} />}>
                  <UserIcon size={14} />
                  <Trans>Profile</Trans>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggle} className="whitespace-nowrap">
                  {theme === "dark" ? <SunIcon size={14} /> : <MoonIcon size={14} />}
                  <Trans>Toggle theme</Trans>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => authClient.signOut().then(() => navigate(getHomeRoute()))}>
                  <DoorOpenIcon size={14} />
                  <Trans>Sign out</Trans>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" render={<Link to={signInHref} />}>
              <Trans>Sign in</Trans>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
