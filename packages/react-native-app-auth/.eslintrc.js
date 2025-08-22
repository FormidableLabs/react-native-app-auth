module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true, // Add Jest globals for test files
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  globals: {
    fetch: 'readonly', // Add fetch as a global
  },
  ignorePatterns: [
    'plugin/build/',
    'node_modules/',
    'android/',
    'ios/',
  ],
  rules: {
    // Add only basic rules to avoid dependency conflicts
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
};