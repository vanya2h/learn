import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("sign-in", "./routes/sign-in.tsx"),
  route("sign-up", "./routes/sign-up.tsx"),
  route("curriculum/:curriculumId", "./routes/curriculum.$curriculumId.tsx"),
  route("topic/:curriculumId/:taskId", "./routes/topic.$curriculumId.$taskId.tsx"),
  route("api/*", "./routes/api.ts"),
] satisfies RouteConfig;
