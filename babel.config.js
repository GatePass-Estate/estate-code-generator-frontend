module.exports = function (api) {
  const isProd = api.env('production');
  api.cache.using(() => (isProd ? 'production' : 'development'));

  const plugins = ['react-native-reanimated/plugin'];

  if (isProd) {
    plugins.unshift(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins,
    compact: false,
  };
};
