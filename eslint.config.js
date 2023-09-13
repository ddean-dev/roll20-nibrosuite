import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.d.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { modules: true },
        ecmaVersion: "latest",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      ts,
    },
    rules: {
      "no-var": "error",
      "sort-imports": "error",
    },
  },
];
