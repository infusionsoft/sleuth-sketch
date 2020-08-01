const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const plugins = process.env.NODE_ENV === 'production' ? [new TerserPlugin({
    sourceMap: true,
})] : [];

module.exports = {
    publicPath: 'sleuth-sketch',
    
    outputDir: path.resolve(__dirname, "./docs"),

    lintOnSave: true,

    css: {
        extract: false,
    },

    configureWebpack: () => {
        const webpackConfig = { optimization: {}, resolve: {} };

        if (process.env.NODE_ENV === 'production') {
            webpackConfig.optimization.splitChunks = {
                chunks: 'async',
                minSize: 30000,
                maxSize: 1500000,
                minChunks: 1,
                maxAsyncRequests: 5,
                maxInitialRequests: 6,
                automaticNameDelimiter: '~',
                name: true,
                cacheGroups: {
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                },
            };
        }

        webpackConfig.resolve.alias = {
            assets: path.resolve('./src/assets'),
            appMixins: path.resolve('./src/mixins'),
            appstyles: path.resolve('./src/styles'),
            components: path.resolve('./src/components'),
            images: path.resolve('./src/assets/images'),
            src: path.resolve('./src'),
            test: path.resolve('./test'),
        };

        webpackConfig.plugins = [
            new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /ar|de|en|es|fr|ja|pt|ru|vi|zh/), // eslint-disable-line
            new webpack.LoaderOptionsPlugin({ options: {} }),
            ...plugins,
        ];

        return webpackConfig;
    },

    chainWebpack: (config) => {
        const svgRule = config.module.rule('svg');

        svgRule.uses.clear();

        svgRule
            .use('svg-sprite-loader')
            .loader('svg-sprite-loader');
    },
};
