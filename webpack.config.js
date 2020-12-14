const CompressionPlugin = require("compression-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const webpack = require('webpack');

module.exports = {
  entry: {
    index: "/src/index.js",
  },
  output: {
    filename: "dsoLoader.min.js",
    path: __dirname + "/dist",
  },
  plugins: [
    new CompressionPlugin({
      compressionOptions: { level: 1 },
    }),
    new webpack.DefinePlugin({
      DEBUG: JSON.stringify(true),
    }),    
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: "es5",
          parse: {},
          compress: {},
          mangle: true, // Note `mangle.properties` is `false` by default.
          module: false,
          // Deprecated
          output: null,
          format: null,
          toplevel: true,
          nameCache: null,
          ie8: false,
          keep_classnames: false,
          keep_fnames: false,
          safari10: false,
        },
      }),
    ],
  },
//  module: {
//    rules: [
//      {
//        test: /\.m?js$/,
//        exclude: /(dist)/,
//        use: {
//          loader: "babel-loader",
//          options: {
//            presets: ["@babel/preset-env"],
//          },
//        },
//      },
//    ],
//  },
};
