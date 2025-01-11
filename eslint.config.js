import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2022,
      sourceType: "module"
    }
  },
  pluginJs.configs.recommended,
  {
    ignores: ['spec/', '*.spec.js', 'node_modules/', 'stratox-vite-plugin.js'],
  },
  {
    files: ["src/**/*.js"],
    rules: {
      'no-unused-vars': 'off',
      'class-methods-use-this': 'off',
      'no-console': 'off',
      'no-plusplus': 'off',
    }
  }
];