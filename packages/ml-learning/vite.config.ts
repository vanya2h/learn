import type { IncomingMessage, ServerResponse } from "node:http";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "api-chat",
      configureServer(server) {
        server.middlewares.use("/api/chat", async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") {
            res.writeHead(405);
            res.end();
            return;
          }

          try {
            const chunks: Buffer[] = [];
            for await (const chunk of req as unknown as AsyncIterable<Buffer>) {
              chunks.push(chunk);
            }
            const { messages, system } = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              messages: Array<{ role: string; content: string }>;
              system?: string;
            };

            const { chat, toServerSentEventsResponse } = await import("@tanstack/ai");
            const { anthropicText } = await import("@tanstack/ai-anthropic");

            const adapter = anthropicText("claude-sonnet-4-6");
            const stream = chat({
              adapter,

              messages: messages as any,
              systemPrompts: system ? [system] : [],
              maxTokens: 8000,
            });

            const webResponse = toServerSentEventsResponse(stream);

            res.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()));
            const reader = webResponse.body!.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
            } finally {
              reader.releaseLock();
              res.end();
            }
          } catch (err) {
            if (!res.headersSent) {
              res.writeHead(500, { "Content-Type": "application/json" });
            }
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      },
    },
  ],
});
