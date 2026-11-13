const { palette } = require('./src/shared/theme/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind 4.2+ on web needs class mode so colorScheme.set doesn't crash.
  darkMode: 'class',
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  // Tests are excluded: Tailwind reads any class-shaped text as a class, so a regex like
  // `h-[\\d.]+` in a test generates an invalid style and breaks the app bundle.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}', '!./src/**/__tests__/**'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontSize: {
        // Micro sizes used across native screens
        '2xs': '8.96px',
        caption: '11.2px',
        xs: '12px',
        sm: '14px',
        base: '16px',
        md: '17px',
        lg: '18px',
        xl: '20px',
        'heading-sm': '21.88px',
        '2xl': '24px',
        heading: '27.34px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
        '6xl': '60px',
        '7xl': '72px',
        '8xl': '96px',
        '9xl': '128px',
      },

      fontFamily: {
        'ubuntu-extralight': ['UbuntuSans-ExtraLight', 'system-ui'],
        'ubuntu-light': ['UbuntuSans-Light', 'system-ui'],
        'ubuntu-regular': ['UbuntuSans-Regular', 'system-ui'],
        'ubuntu-medium': ['UbuntuSans-Medium', 'system-ui'],
        'ubuntu-semibold': ['UbuntuSans-SemiBold', 'system-ui'],
        'ubuntu-bold': ['UbuntuSans-Bold', 'system-ui'],
        'ubuntu-extrabold': ['UbuntuSans-ExtraBold', 'system-ui'],
        'ubuntu-italic': ['UbuntuSansItalic', 'system-ui'],
        'roboto-italic': ['RobotoItalic', 'system-ui'],
        'roboto-regular': ['Roboto', 'system-ui'],
        'inter-extralight': ['Inter_18pt-ExtraLight', 'system-ui'],
        'inter-light': ['Inter_18pt-Light', 'system-ui'],
        'inter-regular': ['Inter_18pt-Regular', 'system-ui'],
        'inter-medium': ['Inter_18pt-Medium', 'system-ui'],
        'inter-medium-italic': ['Inter_18pt-mediumItalic', 'system-ui'],
        'inter-semibold': ['Inter_18pt-SemiBold', 'system-ui'],
        'inter-extrabold': ['Inter_18pt-ExtraBold', 'system-ui'],
        roboto: ['Roboto', 'system-ui'],
        UbuntuSans: ['"UbuntuSans"', 'system-ui'],
        UbuntuSansItalic: ['"UbuntuSansItalic"', 'system-ui'],
        Inter: ['Inter_18pt-Regular', 'system-ui'],
      },

      colors: palette,

      borderWidth: {
        micro: '0.1px',
        mini: '0.5px',
      },
    },
  },
  plugins: [],
};
