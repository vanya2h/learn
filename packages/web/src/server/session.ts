import { redirect } from "react-router";
import { getAuthLinks } from "../lib/routes";
import { auth } from "./auth";

export async function requireSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    const url = new URL(request.url);
    const target = `${url.pathname}${url.search}`;
    throw redirect(getAuthLinks().signInWithRedirect(target));
  }
  return session;
}
