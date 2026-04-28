import { app } from "../../src/server/app";
import type { Route } from "./+types/api";

export async function loader({ request }: Route.LoaderArgs) {
  return app.fetch(request);
}

export async function action({ request }: Route.ActionArgs) {
  return app.fetch(request);
}
