const headerFont = 'Agelast'
const bodyFont = 'Astrobia'

module.exports = {
	content: ['./public/*.html'],
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