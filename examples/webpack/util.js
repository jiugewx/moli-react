var path = require('path');
var fs = require('fs');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var UtilFiles;

function checkFile(projects, name) {
  if (projects || projects.length === 0) {
    return true
  }
  for (var j = 0; j < projects.length; j++) {
    if (new RegExp(projects[j]).test(name)) {
      return true;
    }
  }
  return false
}
var Util = {
  getFileList: function () {
    if (UtilFiles) return UtilFiles;
    var pageDir = path.resolve(__dirname, '../pages');
    if (!fs.existsSync(pageDir)) {
      throw new Error("can't find pages directory!")
    }
    var files = fs.readdirSync(pageDir);
    if (!files || files.length === 0) {
      throw new Error("cant't find any page!")
    }
    files = files.filter((file) => {
      return fs.existsSync(pageDir + '/' + file + "/app.js")
    });
    if (files.length === 0) {
      throw  new Error("can't find app.js ")
    }
    UtilFiles = files;
    return files;
  },
  getResolve: function (resolve) {
    var resolve = Object.assign({
      'utils': path.resolve(__dirname, '../utils'),
    }, resolve);
    // 把项目名也作为一个resolve
    var files = Util.getFileList(), fileName;
    for (var i = 0; i < files.length; i++) {
      fileName = files[i];
      resolve[fileName] = "pages/" + fileName
    }
    return resolve;
  },
  getPages: function (lib, toArray, env, filters) {
    var files = Util.getFileList();
    var entries = {}, plugins = [], comChunks = ['vendor'];
    env = env || "development";
    if (lib) {
      for (var libName in lib) {
        entries[libName] = lib[libName];
        if (libName !== "vendor") {
          comChunks.push(libName);
        }
      }
    }
    for (var i = 0; i < files.length; i++) {
      var fileName = files[i];

      // if (!checkFile(filters, fileName)) continue;

      if (toArray) {
        entries[fileName + "/app"] = ["./pages/" + fileName + "/app.js"];
      } else {
        entries[fileName + "/app"] = "./pages/" + fileName + "/app.js";
      }
      let chunkArr = [];
      plugins.push(new HtmlWebpackPlugin({
        filename: fileName + '/index.html', // 输出
        template: "pages/" + fileName + "/index.ejs", // 输入
        data: {
          lib: env === 'development'
            ? ''
            : '<script type="text/javascript" src="/dist/vendor.js"></script>'
        },
        inject: 'body',
        chunks: comChunks.concat([fileName + '/app'])
      }))
    }
    return {
      entries,
      plugins
    }
  }
};

module.exports = Util;