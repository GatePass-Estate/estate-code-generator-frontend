/** @type {import('tailwindcss').Config} */
module.exports = {
	// NOTE: Update this to include the paths to all files that contain Nativewind classes.
	content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			fontSize: {
				md: '17px',
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
				'inter-extralight': ['Inter_18pt-ExtraLight', 'system-ui'],
				'inter-light': ['Inter_18pt-Light', 'system-ui'],
				'inter-regular': ['Inter_18pt-Regular', 'system-ui'],
				'inter-medium': ['Inter_18pt-Medium', 'system-ui'],
				'inter-semibold': ['Inter_18pt-SemiBold', 'system-ui'],
				roboto: ['Roboto', 'system-ui'],
				UbuntuSans: ['"UbuntuSans"', 'system-ui'],
				UbuntuSansItalic: ['"UbuntuSansItalic"', 'system-ui'],
				Inter: ['"Inter"', 'system-ui'],
			},

			colors: {
				primary: '#113E55',
				secondary: '#1E40AF',
				accent: '#CEE5ED',
				orange: '#F46036',
				teal: '#1B998B',
				grey: '#9B9797',
				tertiary: '#F46036',
				'light-orange': '#FFF8F5',
				'light-teal': '#F4FFFE',
				'light-grey': '#F7F9F9',
				'dark-teal': '#167a6f',
				body: '#FBFEFF',
				'input-border': '#D1D5DB',
				danger: '#ED0808',
				black: '#04121A',
			},

			borderWidth: {
				micro: '0.1px',
				mini: '0.5px',
			},
		},
	},
	plugins: [],
};
