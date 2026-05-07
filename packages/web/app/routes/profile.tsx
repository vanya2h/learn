import { Trans, useLingui } from "@lingui/react/macro";
import { CheckIcon, FileTextIcon, TrashIcon, UploadIcon, XIcon } from "@phosphor-icons/react";
import type { UserProfile } from "@prisma/client-generated";
import { DetailedError, parseResponse } from "hono/client";
import { useRef, useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { GridBackground } from "../../src/components/GridBg";
import { Markdown } from "../../src/components/Markdown";
import { ProgramCover } from "../../src/components/ProgramCover";
import { TopicContainer } from "../../src/components/TopicContainer";
import { useTheme } from "../../src/hooks/useTheme";
import { apiClient } from "../../src/lib/apiClient";
import { GRADIENT_PRESETS } from "../../src/lib/gradient";
import { getHomeRoute } from "../../src/lib/routes";
import { auth } from "../../src/server/auth";
import { db } from "../../src/server/db";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/profile";

import { Card } from "~/components/Card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Profile — Learning Tracker" },
    { name: "description", content: "Your CV-derived learning profile." },
  ];
}

function extractErrorMessage(err: unknown): string | null {
  if (!(err instanceof DetailedError)) return null;
  const data = err.detail?.data as { error?: unknown } | undefined;
  return typeof data?.error === "string" ? data.error : null;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { markdown: true, targetRoles: true, updatedAt: true },
  });

  return {
    user: { name: session!.user.name },
    profile: profile
      ? {
          markdown: profile.markdown,
          targetRoles: profile.targetRoles,
          updatedAt: profile.updatedAt.toISOString(),
        }
      : null,
  };
}

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, profile } = loaderData;
  const { theme } = useTheme();

  return (
    <div className="relative flex flex-1 flex-col grow">
      <div className="absolute inset-0">
        <ProgramCover shape="wave" preset={theme === "dark" ? GRADIENT_PRESETS.heroDark : GRADIENT_PRESETS.heroLight} />
      </div>
      <div className="relative grow flex flex-col">
        <GridBackground />
        <TopicContainer className="py-8 grow">
          {profile ? <FilledState user={user} profile={profile} /> : <EmptyState user={user} />}
        </TopicContainer>
      </div>
    </div>
  );
}

function EmptyState({ user }: { user: { name: string } }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { t } = useLingui();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setError(t`Please upload a PDF.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await parseResponse(apiClient.api.profile.upload.$post({ form: { file } }));
      void revalidator.revalidate();
    } catch (err) {
      setError(extractErrorMessage(err) ?? t`Something went wrong. Please try again.`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSkip() {
    try {
      await parseResponse(apiClient.api.profile["skip-onboarding"].$post());
      navigate(getHomeRoute());
    } catch {
      navigate(getHomeRoute());
    }
  }

  return (
    <Card.List>
      <Card.Entry>
        <Card.Heading>
          <Trans>Hello, {user.name}</Trans>
        </Card.Heading>
        <Card.CardSubheading className="mt-2">
          <Trans>
            Upload your CV so we can tailor every curriculum, assessment, and explanation to what you already know — and
            what you actually want to do next.
          </Trans>
        </Card.CardSubheading>
      </Card.Entry>
      <Card.Entry>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) void handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex min-h-32 h-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center transition-colors hover:bg-muted/40",
            dragOver && "border-foreground/40 bg-muted/60",
            uploading && "pointer-events-none opacity-80",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <>
              <Spinner />
              <p className="text-sm text-muted-foreground">
                <Trans>Reading your CV and extracting your profile…</Trans>
              </p>
            </>
          ) : (
            <>
              <UploadIcon size={28} className="text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  <Trans>Drop your CV here, or click to browse</Trans>
                </p>
                <p className="text-xs text-muted-foreground">
                  <Trans>PDF only · max 10 pages of text</Trans>
                </p>
              </div>
            </>
          )}
        </div>
      </Card.Entry>

      {error && (
        <Card.Entry>
          <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 rounded-lg">
            {error}
          </p>
        </Card.Entry>
      )}

      <Card.Entry className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          <Trans>
            Your CV is sent to Anthropic to extract a profile. We don&apos;t store the PDF or its raw text — only the
            structured profile shown below.
          </Trans>
        </p>
        <Button variant="ghost" size="sm" onClick={() => void handleSkip()} disabled={uploading} className="shrink-0">
          <Trans>Skip for now</Trans>
        </Button>
      </Card.Entry>
    </Card.List>
  );
}

type Profile = Pick<UserProfile, "markdown" | "targetRoles"> & { updatedAt: string };

function FilledState({ user, profile }: { user: { name: string }; profile: Profile }) {
  const revalidator = useRevalidator();
  const { t } = useLingui();
  const [markdown, setMarkdown] = useState(profile.markdown);
  const [targetRoles, setTargetRoles] = useState(profile.targetRoles);
  const [savingMarkdown, setSavingMarkdown] = useState(false);
  const [reuploadOpen, setReuploadOpen] = useState(false);
  const [reuploading, setReuploading] = useState(false);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const reuploadInputRef = useRef<HTMLInputElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const dirty = markdown !== profile.markdown;

  async function saveMarkdown() {
    setSavingMarkdown(true);
    try {
      await parseResponse(apiClient.api.profile.$patch({ json: { markdown } }));
      void revalidator.revalidate();
    } finally {
      setSavingMarkdown(false);
    }
  }

  async function persistTargetRoles(next: string[]) {
    setTargetRoles(next);
    try {
      await parseResponse(apiClient.api.profile.$patch({ json: { targetRoles: next } }));
      void revalidator.revalidate();
    } catch {
      setTargetRoles(profile.targetRoles);
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await parseResponse(apiClient.api.profile.$delete());
      setDeleteOpen(false);
      void revalidator.revalidate();
    } catch (err) {
      setDeleteError(extractErrorMessage(err) ?? t`Something went wrong. Please try again.`);
    } finally {
      setDeleting(false);
    }
  }

  async function handleReupload(file: File) {
    if (file.type !== "application/pdf") {
      setReuploadError(t`Please upload a PDF.`);
      return;
    }
    setReuploadError(null);
    setReuploading(true);
    try {
      await parseResponse(apiClient.api.profile.upload.$post({ form: { file } }));
      setReuploadOpen(false);
      void revalidator.revalidate();
    } catch (err) {
      setReuploadError(extractErrorMessage(err) ?? t`Something went wrong. Please try again.`);
    } finally {
      setReuploading(false);
    }
  }

  return (
    <Tabs defaultValue="preview">
      <Card.List>
        <Card.Entry>
          <Card.Heading>
            <Trans>Hello, {user.name}</Trans>
          </Card.Heading>
        </Card.Entry>

        <Card.Entry className="flex items-center justify-between gap-4">
          <Card.Heading>
            <Trans>Your Profile</Trans>
          </Card.Heading>
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="preview">
                <Trans>Preview</Trans>
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Trans>Edit</Trans>
              </TabsTrigger>
            </TabsList>
            {dirty && (
              <Button size="sm" onClick={() => void saveMarkdown()} disabled={savingMarkdown}>
                {savingMarkdown ? <Spinner /> : <CheckIcon size={14} />}
                <Trans>Save changes</Trans>
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={() => setReuploadOpen(true)}>
              <FileTextIcon size={14} />
              <Trans>Re-upload CV</Trans>
            </Button>
          </div>
        </Card.Entry>
        <Card.Entry>
          <TabsContent value="preview">
            <Markdown>{markdown}</Markdown>
          </TabsContent>
          <TabsContent value="edit" className="mt-3">
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={20}
              className="font-mono text-xs"
              aria-label={t`Profile markdown`}
            />
          </TabsContent>
        </Card.Entry>

        <Card.Entry>
          <Card.Heading>
            <Trans>Target roles</Trans>
          </Card.Heading>
          <div className="mt-2">
            <TargetRolesEditor value={targetRoles} onChange={(next) => void persistTargetRoles(next)} />
          </div>
        </Card.Entry>

        <Card.Entry className="flex items-center justify-between gap-4">
          <div>
            <Card.Heading>
              <Trans>Danger zone</Trans>
            </Card.Heading>
            <Card.CardSubheading>
              <Trans>Removes your profile permanently. Curriculums won&apos;t be tailored until you re-upload.</Trans>
            </Card.CardSubheading>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} className="shrink-0">
            <TrashIcon size={14} />
            <Trans>Delete</Trans>
          </Button>
        </Card.Entry>
      </Card.List>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans>Delete profile</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>
                This permanently deletes your profile, including the markdown and target roles. Curriculums and
                assessments will no longer be tailored to your background until you upload a new CV. This can&apos;t be
                undone.
              </Trans>
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 rounded-lg">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              <Trans>Cancel</Trans>
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? <Spinner /> : <TrashIcon size={14} />}
              <Trans>Delete profile</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reuploadOpen} onOpenChange={setReuploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans>Re-upload CV</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>
                Uploading a new CV will replace your current profile, including any manual edits you&apos;ve made to the
                markdown or target roles. This can&apos;t be undone.
              </Trans>
            </DialogDescription>
          </DialogHeader>

          <input
            ref={reuploadInputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleReupload(file);
              e.target.value = "";
            }}
          />

          {reuploadError && (
            <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2 rounded-lg">
              {reuploadError}
            </p>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReuploadOpen(false)} disabled={reuploading}>
              <Trans>Cancel</Trans>
            </Button>
            <Button onClick={() => reuploadInputRef.current?.click()} disabled={reuploading}>
              {reuploading ? <Spinner /> : <UploadIcon size={14} />}
              <Trans>Choose new PDF</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

function TargetRolesEditor({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const { t } = useLingui();
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {value.length === 0 && (
          <p className="text-sm text-muted-foreground">
            <Trans>No target roles yet — add ones you&apos;re aiming for.</Trans>
          </p>
        )}
        {value.map((role) => (
          <Badge key={role} variant="secondary" className="gap-1.5 pr-1.5">
            {role}
            <button
              type="button"
              onClick={() => onChange(value.filter((r) => r !== role))}
              className="ml-0.5 -mr-0.5 inline-flex size-3.5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t`Remove ${role}`}
            >
              <XIcon size={10} />
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={t`e.g. Senior Frontend Engineer`}
          size="sm"
          className="max-w-xs"
        />
        <Button variant="secondary" size="sm" onClick={add} disabled={!draft.trim()}>
          <Trans>Add</Trans>
        </Button>
      </div>
    </div>
  );
}
