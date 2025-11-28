module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    node: true,
    // We keep 'jest: true' here as a good default
    jest: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': 'off', // Allows you to use console.log
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Warns about unused variables
  },

  // --- THIS IS THE FIX ---
  // This block tells ESLint to apply special rules ONLY to your test files.
  overrides: [
    {
      // This glob pattern matches all files ending in .test.js
      files: ['**/*.test.js'],
      // This tells ESLint to apply the Jest environment to these files
      env: {
        jest: true,
      },
    },
  ],
  // --- END OF FIX ---
};