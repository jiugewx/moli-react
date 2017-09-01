process.env.NODE_ENV = 'development';
process.env.PORT = 9009;

// 生成一个静态服务器
var staticServer = require("./node.server");
var merge = require('webpack-merge');
var webpack = require('webpack');
var config = require("./webpack.base.config.js");
var BaseConfig = config.base;

var developConfig = merge(BaseConfig, {
  devtool: false,
  module: {       // 在非production环境下，不能使用ExtractTextPlugin插件
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      }
    ]
  },
  plugins: [
    // new webpack.HotModuleReplacementPlugin(),  // webpack-dev-server --hot 与 HotModuleReplacementPlugin 冲突
    new webpack.NoEmitOnErrorsPlugin()
  ].concat(BaseConfig.plugins),

  devServer: {
    historyApiFallback: true,  //不跳转
    contentBase: '../dist/',
    host: '0.0.0.0',
    port: process.env.PORT,
    proxy: {
      // 设置开发的代理请求
      '/proxyPrefix': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
        pathRewrite: {
          '^/proxyPrefix': ''
        }
      },
      // 静态资源服务器
      '/static': {
        target: "http://localhost:8082/",
        changeOrigin: true,
        pathRewrite: {
          '^/static': ''
        }
      }
    }
  },
});

staticServer(8082, '../', "static server");

module.exports = developConfig;
