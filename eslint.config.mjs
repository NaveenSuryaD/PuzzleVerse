import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  ...expoConfig,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.expo/**',
      'design/**',
      'scripts/**',
      'puzzleverse-bible/**',
    ],
  },
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      // React Compiler rules — only relevant when React Compiler is enabled
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
]);
