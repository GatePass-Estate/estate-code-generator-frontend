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
				UbuntuSans: ['"UbuntuSans"', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
				Inter: ['"Inter"', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
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
