// const headerFont = 'MandatoryPlaything'
// const bodyFont = 'Inertia'
// const bodyFont = 'NeoLatina'

const headerFont = 'MandatoryPlaything'
const bodyFont = "NeoLatina" 

module.exports = {
	content: ['./public/*.html', './src/**/*.ts', './src/**/*.tsx', './src/**/*.js', './src/**/*.jsx'],
	theme: {
		extend: {
		},
		fontFamily: { 
			'header': headerFont,
			'body': bodyFont,
		}
	},
	variants: {
		extend: {},
	},
	plugins: [],
}