// https://docs.expo.dev/guides/using-eslint/
const fs = require('fs');
const path = require('path');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/**
 * Feature boundary (ARCHITECTURE.md → Dependency rules): a feature may use another feature's
 * hooks, components, services, types, utils and store, but never its `screens/` — screens are
 * reached only through `app/` routes. Barrel-only imports are deliberately NOT enforced: with
 * features that depend on each other both ways, forcing everything through index.ts creates
 * require cycles and loads whole features for one helper.
 */
// ESLint runs from the project root.
const FEATURES_DIR = path.resolve('src/features');
const featureBoundaries = fs
  .readdirSync(FEATURES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map(({ name }) => ({
    files: [`src/features/${name}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/src/features/*/screens/**', `!@/src/features/${name}/screens/**`],
              message:
                "Don't import another feature's screens. Move the shared piece into that feature's components/ or hooks/.",
            },
            {
              group: ['@/app/**'],
              message: 'src/ never imports from app/ routes.',
            },
          ],
        },
      ],
    },
  }));

module.exports = defineConfig([
  expoConfig,
  ...featureBoundaries,
  {
    ignores: ['dist/*', '.claude/**'],
    // SDK 57 pulls in eslint-plugin-react-hooks@7 (React Compiler rules).
    // These flag common RN patterns (Animated.Value refs, Reanimated shared
    // values, fetch-on-mount setState) across the whole app — turn them off
    // until we adopt the React Compiler and can fix them deliberately.
    // CQ-17: single override block (was duplicated).
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
    },
  },
]);
