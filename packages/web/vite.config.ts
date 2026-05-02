import { lingui } from "@lingui/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    babel({
      filter: /\.(j|t)sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: ["@lingui/babel-plugin-lingui-macro"],
      },
    }),
    lingui(),
    reactRouter(),
  ],
  ssr: {
    noExternal: command === "build" ? true : undefined,
    optimizeDeps: {
      include: ["@prisma/client-generated"],
    },
  },
  build: {
    rollupOptions: {
      external: ["@prisma/client-generated", "@opentelemetry/api"],
    },
  },
}));
