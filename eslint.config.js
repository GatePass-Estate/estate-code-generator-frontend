// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.claude/**'],
  },
  {
    // Expo 57 pulled in React Compiler lint rules (react-hooks v7).
    // This app is not running the compiler, and the rules false-flag
    // Reanimated shared values, RN Animated refs, Date.now() timers, etc.
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
]);
