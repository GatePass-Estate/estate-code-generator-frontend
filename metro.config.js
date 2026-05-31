const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
// ci: security scan clean-run test

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './app/global.css' });
