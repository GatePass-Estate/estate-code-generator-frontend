// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.claude/**'],
  },
  {
    // SDK 57 pulls in eslint-plugin-react-hooks@7 (React Compiler rules).
    // These flag common RN patterns (Animated.Value refs, Reanimated shared
    // values, fetch-on-mount setState) across the whole app — turn them off
    // until we adopt the React Compiler and can fix them deliberately.
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
]);
