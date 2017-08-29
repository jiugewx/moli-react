var path = require('path');
var filesize = require('rollup-plugin-filesize');
var babel = require('rollup-plugin-babel');

var commonjs = require('rollup-plugin-commonjs');
var resolve = require('rollup-plugin-node-resolve');

var replace = require('rollup-plugin-replace');
var uglify = require('rollup-plugin-uglify');
var alias = require('rollup-plugin-alias');

var { rollup } = require('rollup');

var reactDomModulePath = require.resolve('react-dom');
var emptyModulePath = path.resolve(__dirname, 'empty.js');

function build(target, minify) {
    var targetExt = minify ? '.min.js' : '.js';
    var filename = (function () {
        switch (target) {
            case 'browser':
                return 'index' + targetExt;
            default:
                throw new Error('Unexpected target: ' + target);
        }
    })();

    var namedExports = {};
    namedExports[emptyModulePath] = ['unstable_batchedUpdates'];
    namedExports[reactDomModulePath] = ['unstable_batchedUpdates'];

    var plugins = [
        replace({
            __TARGET__: JSON.stringify(target),
        }),
        // 编译es6
        babel({
            exclude: 'node_modules/**',
            presets: ['es2015-rollup', 'react'],
            plugins: ['transform-decorators-legacy', 'transform-class-properties'],
        }),
        alias({
            'react-dom': emptyModulePath,
        }),
        resolve({
            module: true,
            main: true,
        }),
        // 输出
        commonjs({
            exclude: [
                'node_modules/react/**',
                'node_modules/react-dom/**',
                'node_modules/mobx/**',
            ],
            namedExports: namedExports,
        }),
    ];

    if (minify) {
        plugins.push(
            uglify({
                compress: {
                    warnings: false,  //当删除没有用处的代码时，显示警告
                    drop_console: true, // 传true的话会干掉console.*函数。
                    dead_code: true,
                    drop_debugger:true,
                    if_return:true // 优化 if/return 和 if/continue
                },
                mangle: {
                    properties: true,
                },
                nameCache: null, // or specify a name cache object
                ie8: true
            })
        );
    } else {
        plugins.push(
            uglify({
                output: {
                    beautify: true,  // 格式化
                    preamble: "/* author:xizhi */",   // 文件头
                    quote_style: 2
                },
                mangle: false, // 是否混淆
                ie8: true//支持IE8
            })
        );
    }

    plugins.push(filesize());

    var trueFn = function () {
        return true;
    };
    var falseFn = function () {
        return false;
    };

    return rollup({
        input: 'src/index.js',
        external: function (moduleId) {
            return ({
                'react': trueFn,
                'react-dom': function () {
                    return target === 'browser';
                },
                'mobx': trueFn,
            }[moduleId] || falseFn)();
        },
        plugins: plugins,
    })
        .then(function (bundle) {
            var options = {
                file: path.resolve(__dirname, filename),
                format: 'umd',
                name: 'Moli',
                exports: 'named',
                globals: {
                    'react': 'React',
                    'react-dom': 'ReactDOM',
                    'mobx': 'mobx',
                },
            };

            return bundle.write(options);
        })
        .catch(function (reason) {
            console.error(reason);
            process.exit(-1);
        });
}

build('browser');
build('browser', true);