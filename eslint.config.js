// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // dist: compilado. ._*: metadatos de macOS en el disco exFAT.
    ignores: ['dist/*', '**/._*'],
  },
]);
