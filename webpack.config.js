const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: 'development',
	context: path.resolve(__dirname, 'src'),
	entry: {
		index: {
			import: './index.js',
			filename: 'index.js'
		},
		datareader: {
			import: './datareader.js',
			filename: 'datareader.js'
		}
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				'**/*.css',
				'**/*.html'
			]
		})
	],
	output: {
		clean: true
	},
	devtool: 'source-map'
};
