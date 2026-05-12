import type { Route } from "./+types/api";

import { app } from "~/server/app";

export async function loader({ request }: Route.LoaderArgs) {
  return app.fetch(request);
}

export async function action({ request }: Route.ActionArgs) {
  return app.fetch(request);
}
