import { Dashboard } from "../../src/components/Dashboard";
import { Header } from "../../src/components/Header";
import { requireSession } from "../../src/server/session";
import type { Route } from "./+types/home";

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);
  return {};
}

export default function HomePage() {
  return (
    <>
      <Header />
      <Dashboard />
    </>
  );
}
