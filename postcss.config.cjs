module.exports = {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
	// Ensure PostCSS only processes CSS, not Svelte files
	exclude: /\.svelte$/,
}