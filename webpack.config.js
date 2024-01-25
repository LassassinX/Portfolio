const path = require('path');

module.exports = {
	entry: './src/index.ts',
	devtool: 'inline-source-map',
	mode: "development",
	output: {
		path: path.resolve(__dirname, 'public'),
		filename: 'index.js',
	},
	devServer: {
		hot: true,
		compress: true,
		port: 2000,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			}, 
			{
				test: /\.(png|jpg|gif|mp3|wav)$/,
				type: 'asset/resource',
			},
			{
				test: /\.css$/i,
				include: path.resolve(__dirname, 'src'),
				use: ['style-loader', 'css-loader', 'postcss-loader'],
			},
		],
	}, resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
}