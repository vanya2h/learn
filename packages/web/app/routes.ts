import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  route("sign-in", "./routes/sign-in.tsx"),
  route("sign-up", "./routes/sign-up.tsx"),
  route("api/*", "./routes/api.ts"),
  layout("./routes/app-layout.tsx", [
    index("./routes/home.tsx"),
    route("curriculum/new", "./routes/curriculum.new.tsx"),
    route("curriculum/:curriculumId", "./routes/curriculum.$curriculumId.tsx"),
    route("topic/:curriculumId/:taskId", "./routes/topic-layout.tsx", [
      index("./routes/topic.index.tsx"),
      route("choice", "./routes/topic.choice.tsx"),
      route("assess", "./routes/topic.assess.tsx"),
      route("gaps", "./routes/topic.gaps.tsx"),
      route("study", "./routes/topic.study.tsx"),
      route("hands-on", "./routes/topic.hands-on.tsx"),
      route("feedback", "./routes/topic.feedback.tsx"),
      route("write-up", "./routes/topic.write-up.tsx"),
      route("complete", "./routes/topic.complete.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
