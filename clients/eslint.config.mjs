import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginPrettier from "eslint-plugin-prettier";
import pluginReact from "eslint-plugin-react";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginImport from "eslint-plugin-import";
import pluginTypescript from "@typescript-eslint/eslint-plugin";
import pluginReactHooks from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Base parser configuration
  {
    languageOptions: {
      parser: "@typescript-eslint/parser",
      parserOptions: {
        sourceType: "module",
        allowImportExportEverywhere: true,
        ecmaVersion: 2022,
      },
    },
    settings: {
      react: {
        version: "detect", // Added to automatically detect React version
      },
    },
  },

  // Extends and plugins from original config
  ...compat.extends(
    "next",
    "plugin:@next/next/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
  ),
  eslintConfigPrettier,
  {
    plugins: {
      prettier: pluginPrettier,
      react: pluginReact,
      "jsx-a11y": pluginJsxA11y,
      import: pluginImport,
      "@typescript-eslint": pluginTypescript,
      "react-hooks": pluginReactHooks, // Added missing plugin
    },
  },

  // Rules from original config
  {
    rules: {
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react/jsx-filename-extension": [1, { extensions: [".js", ".jsx", "ts", ".tsx"] }],
      "react/jsx-indent-props": [1, 2],
      "react/jsx-indent": [1, 2],
      "react/prefer-stateless-function": [1],
      "react/static-property-placement": [1, "property assignment"],
      "no-undef": [1],
      "import/first": "error",
      "import/newline-after-import": "off",
      "import/no-duplicates": "error",
      "import/no-extraneous-dependencies": 0,
      "import/no-named-as-default": "off",
      "no-nested-ternary": "off",
      "jsx-a11y/click-events-have-key-events": "off",
    },
  },

  // Settings from original config
  {
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        alias: {
          map: [["@", "./"]], // Fixed property name from 'alias' to 'map'
          extensions: [".ts", ".js", ".jsx", ".tsx", ".json"],
        },
      },
    },
  },

  // Ignore patterns
  {
    ignores: [
      "**/node_modules/*",
      "dist/*",
      "build/*",
      "*.config.js",
      ".env",
      "**/*.test.ts",
      "**/*.spec.ts", // Added common test pattern
    ],
  },
];

export default eslintConfig;
