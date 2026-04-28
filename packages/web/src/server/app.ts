import { Hono } from "hono";
import { requireAuth } from "./middleware/requireAuth";
import { chatRoute } from "./routes/chat";
import { progressRoute } from "./routes/progress";
import { auth } from "./auth";

const app = new Hono()
  .onError((err, c) => {
    console.error("[api] unhandled error:", err);
    return c.json({ error: err.message }, 500);
  })
  // Public: Better Auth handles all /api/auth/** paths
  .on(["GET", "POST"], "/api/auth/**", (c) => auth.handler(c.req.raw))
  // Protected routes
  .use("/api/chat", requireAuth)
  .use("/api/progress/*", requireAuth)
  .route("/api", chatRoute)
  .route("/api", progressRoute);

export type AppType = typeof app;
export { app };
