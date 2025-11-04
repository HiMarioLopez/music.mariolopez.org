import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  // Base recommended rules
  js.configs.recommended,
  
  // Global ignores
  {
    ignores: ["dist/**", "node_modules/**", ".eslintrc.cjs"],
  },
  
  // TypeScript and React files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        __BUILD_TIME__: "readonly",
        __dirname: "readonly",
        // Browser APIs
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // DOM types
        HTMLElement: "readonly",
        HTMLDivElement: "readonly",
        // TypeScript types
        RequestInit: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier: prettier,
    },
    rules: {
      // TypeScript recommended rules
      ...typescript.configs.recommended.rules,
      
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      
      // React Refresh rules
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      
      // Prettier integration
      "prettier/prettier": "warn",
      
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      
      // React Hooks exhaustive deps
      "react-hooks/exhaustive-deps": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  
  // Prettier config to disable conflicting rules
  prettierConfig,
  
  // Config files (vitest.config.ts, etc.)
  {
    files: ["*.config.{js,ts}", "vitest.config.ts"],
    languageOptions: {
      globals: {
        URL: "readonly",
        import: "readonly",
        meta: "readonly",
      },
    },
  },
  
  // Mock/test files - allow non-component exports
  {
    files: ["**/mocks/**/*", "**/__tests__/**/*", "**/*.test.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];

