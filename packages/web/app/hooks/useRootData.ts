import { useRouteLoaderData } from "react-router";

import type { loader } from "~app/root";

type RootData = Awaited<ReturnType<typeof loader>>;

export function useRootData(): RootData | undefined {
  return useRouteLoaderData<RootData>("root");
}
