function joinPath(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/");
}

export function getHomeRoute() {
  return "/";
}

export function getAuthLinks() {
  const base = "";
  return {
    signIn: joinPath(base, "/sign-in"),
    signUp: joinPath(base, "/sign-up"),
    signInWithRedirect: (redirectTo: string) =>
      redirectTo === "/" ? "/sign-in" : `/sign-in?redirect=${encodeURIComponent(redirectTo)}`,
    signUpWithRedirect: (redirectTo: string) =>
      redirectTo === "/" ? "/sign-up" : `/sign-up?redirect=${encodeURIComponent(redirectTo)}`,
  };
}

export type IAuthLinks = ReturnType<typeof getAuthLinks>;

export function getCurriculumLinks() {
  const base = "/curriculum";
  return {
    new: joinPath(base, "new"),
    byId: (curriculumId: string) => joinPath(base, curriculumId),
    draft: (draftId: string) => getDraftLinks(joinPath(base, "draft", draftId)),
  };
}

export type ICurriculumLinks = ReturnType<typeof getCurriculumLinks>;

function getDraftLinks(base: string) {
  return {
    index: base,
    outline: joinPath(base, "outline"),
    phases: (phaseId: string) => joinPath(base, "phases", phaseId),
    finish: joinPath(base, "finish"),
  };
}

export type IDraftLinks = ReturnType<typeof getDraftLinks>;

export function getTopicLinks(curriculumId: string, taskId: string) {
  const base = joinPath("/topic", curriculumId, taskId);
  return {
    index: base,
    choice: joinPath(base, "choice"),
    assess: joinPath(base, "assess"),
    gaps: joinPath(base, "gaps"),
    study: joinPath(base, "study"),
    handsOn: joinPath(base, "hands-on"),
    feedback: joinPath(base, "feedback"),
    writeUp: joinPath(base, "write-up"),
    complete: joinPath(base, "complete"),
  };
}

export type ITopicLinks = ReturnType<typeof getTopicLinks>;
