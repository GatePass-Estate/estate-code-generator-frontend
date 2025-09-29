/** @type {import('tailwindcss').Config} */
module.exports = {
	// NOTE: Update this to include the paths to all files that contain Nativewind classes.
	content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				primary: '#113E55',
				secondary: '#1E40AF',
				accent: '#CEE5ED',
				orange: '#F46036',
				teal: '#1B998B',
				grey: '#9B9797',
				'light-orange': '#FFF8F5',
				'light-teal': '#F4FFFE',
				'light-grey': '#F7F9F9',
				body: '#FBFEFF',
			},
		},
	},
	plugins: [],
};
