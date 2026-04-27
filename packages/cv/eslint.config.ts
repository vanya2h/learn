import { config } from "@vanya2h/eslint-config/react";

export default [
  { ignores: ["dist/"] },
  ...config,
  {
    // @react-pdf/renderer renders to PDF, not HTML — unescaped entities are fine
    files: ["**/*.tsx"],
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];
