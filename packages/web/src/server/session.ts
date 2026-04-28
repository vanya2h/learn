import { redirect } from "react-router";
import { auth } from "./auth";

export async function requireSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/sign-in");
  return session;
}
