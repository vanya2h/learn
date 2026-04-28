import { hc } from "hono/client";
import type { AppType } from "../server/app";

export const apiClient = hc<AppType>(typeof window !== "undefined" ? window.location.origin : "http://localhost");
