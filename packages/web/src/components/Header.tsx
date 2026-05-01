import { Breadcrumbs } from "@cloudflare/kumo/components/breadcrumbs";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Text } from "@cloudflare/kumo/components/text";
import { MoonIcon } from "@phosphor-icons/react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useRootData } from "../../app/hooks/useRootData";
import { useAllCurriculums } from "../hooks/useAllCurriculums";
import { useTheme } from "../hooks/useTheme";
import { authClient } from "../lib/authClient";
import type { AuthUser } from "../server/auth";

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

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ curriculumId?: string }>();

  const isDashboard = location.pathname === "/";
  const activeCurriculumId = params.curriculumId ?? null;
  const allCurriculums = useAllCurriculums();
  const activeCurriculum = activeCurriculumId ? allCurriculums.find((c) => c.id === activeCurriculumId) : null;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border">
      <div className="flex items-center gap-4">
        <Text variant="heading2" as="h1">
          <Link to="/" className="text-foreground hover:opacity-75 transition-opacity">
            Learning Tracker
          </Link>
        </Text>
        {isDashboard ? null : (
          <Breadcrumbs size="sm">
            <Breadcrumbs.Separator />
            <Breadcrumbs.Current>{activeCurriculum?.name ?? ""}</Breadcrumbs.Current>
          </Breadcrumbs>
        )}
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
                Toggle theme
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => authClient.signOut().then(() => navigate("/sign-in"))}>
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
