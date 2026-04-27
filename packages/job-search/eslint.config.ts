import { config } from "@vanya2h/eslint-config/node";

export default [
  { ignores: ["dist/"] },
  ...config,
  {
    files: ["src/cli.ts", "src/scripts/**/*.ts"],
    rules: {
      "n/no-process-exit": "off",
    },
  },
  {
    files: ["eslint.config.ts"],
    rules: {
      "n/no-extraneous-import": "off",
    },
  },
];
