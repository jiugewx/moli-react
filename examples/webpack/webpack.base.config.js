var path = require('path');
var webpack = require('webpack');
var merge = require('webpack-merge');
var ExtractTextPlugin = require('extract-text-webpack-plugin'); //提炼css
var optimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var getStyleLoader = require("./styleLoader.js");
var Util = require('./util');

var isDev = process.env.NODE_ENV === "development";
var output = '../dist/';
var outPutHash = isDev ? "[name].js?[hash:8]" : "[name].js?[chunkhash:12]"; // hash是编译的指纹,chunkhash是模块的指纹
var publicPath = "/";
var pages = Util.getPages(null, true, process.env.NODE_ENV);
var entries = pages.entries;

if (Object.keys(entries).length === 0) {
  console.error("请输入正确的page名,编译终端！！！");
  return;
}
console.log("will build pages =====> " + "\033[32m 当前 NODE_ENV => \033[0m" + process.env.NODE_ENV);
delete entries.vendor;
for (var _name in entries) {
  console.log(`[${_name}]:[${entries[_name]}]`);
}

var BaseConfig = {
  context: path.resolve(__dirname, '../'),
  entry: entries,
  output: {
    path: path.resolve(__dirname, output),
    filename: outPutHash, // 推荐使用 ，但是--hot会报错，
    chunkFilename: outPutHash, // 代码分割
    publicPath: publicPath
  },
  plugins: [
    new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV) }),
  ].concat(pages.plugins),
  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        use: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        use: ['url-loader?limit=8192&name=images/[hash:8].[name].[ext]']
      },
      {
        test: /\.(woff|woff2|eot|ttf)(\?.*$|$)/,
        use: ['url-loader']
      },
    ]
  },
  externals: [{
    // "mobx": "mobx",
    // "mobx-react": "mobx-react",
    // 'react-dom': 'react-dom',
    // "react": "react",
  }],
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.png', '.jpg'],
    alias: Object.assign(Util.getResolve(), {
      'moli-react': path.resolve(__dirname, '../../src/index.js'),
      // 'moli-react': path.resolve(__dirname, '../../index.js'),
      // 'react': 'react-lite',
      // 'react-dom': 'react-lite',
    }),
  },
};

var distConfigs = merge(BaseConfig, {
  devtool: false,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract(getStyleLoader(["css", "postcss"]))
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract(getStyleLoader(["css", "postcss", "less"]))
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin({
      filename: '[name].css?[contenthash:8]', //css的打包地址,添加hash
      allChunks: true,
      disable: false
    }),
    // css压缩
    new optimizeCssAssetsPlugin({})
  ].concat(BaseConfig.plugins),
});

var config = {
  base: BaseConfig,
  dist: distConfigs,
};

module.exports = config;
