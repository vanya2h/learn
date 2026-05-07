import { Hono } from "hono";
import { requireAuth } from "./middleware/requireAuth";
import { chatRoute } from "./routes/chat";
import { curriculumRoute } from "./routes/curriculum";
import { profileRoute } from "./routes/profile";
import { progressRoute } from "./routes/progress";
import { topicSessionRoute } from "./routes/topicSession";
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
  .use("/api/topic-sessions/*", requireAuth)
  .use("/api/curriculums/*", requireAuth)
  .use("/api/profile", requireAuth)
  .use("/api/profile/*", requireAuth)
  .route("/api", chatRoute)
  .route("/api", curriculumRoute)
  .route("/api", progressRoute)
  .route("/api", topicSessionRoute)
  .route("/api", profileRoute);

export type AppType = typeof app;
export { app };
