// Configuracion de ESLint (AJ-19): analisis estatico del codigo
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["node_modules/**", "coverage/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node, ...globals.mocha },
    },
    rules: {
      eqeqeq: "error",
      "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
    },
  },
];
