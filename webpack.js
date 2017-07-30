var path = require('path');
var outputPath = path.resolve(__dirname, './dist');
var webpack = require("webpack");

module.exports = {
  entry: {
    "moli": [path.resolve(__dirname, "./src/index.js")]
  },
  output: {
    path: outputPath,
    filename: "[name].js"
  },
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader'
      }
    ]
  },
  externals: [{
    // "mobx": "mobx",
    "react": "react",
    "mobx-react": "mobx-react",
  }],
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      mangle: false,
      minimize: true,
      comments: false,
      sourceMap: false,
      compress: {warnings: false, drop_console: true},
      output: {comments: false}
    })
  ]
};