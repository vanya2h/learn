import { createMiddleware } from "hono/factory";
import type { AuthSession, AuthUser } from "../auth";
import { auth } from "../auth";

export type AuthEnv = {
  Variables: {
    user: AuthUser;
    session: AuthSession;
  };
};

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});
