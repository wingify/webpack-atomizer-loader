var path = require('path');

module.exports = {
    entry: __dirname + '/index.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: '../dist/atomicLoader',
                query: {
                    minimize: true,
                    configPath: [
                        path.resolve('./atomCssConfig.js'),
                        path.resolve('./atomCssConfig2.js')
                    ]
                }
            },
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['react', 'es2015']
                }
            }
        ]
    }
};
