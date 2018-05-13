'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atomizer = require('atomizer');

var _atomizer2 = _interopRequireDefault(_atomizer);

var _cssnano = require('cssnano');

var _cssnano2 = _interopRequireDefault(_cssnano);

var _loaderUtils = require('loader-utils');

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _ensureFolderExists = require('./ensureFolderExists');

var _ensureFolderExists2 = _interopRequireDefault(_ensureFolderExists);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_CSS_DEST = './build/css/atomic.css';
var PATH_SEP = '/';
var DEFAULT_POSTCSS_PLUGIN_LIST = [];

// cached response to prevent unnecessary update
var cachedResponse = '';

var atomizer = new _atomizer2.default({ verbose: true });
var cache = {};
var cachedResponses = {};
var crypto = require('crypto');

var writeCssFile = function writeCssFile(cssDest, cssString) {
    return new Promise(function (resolve, reject) {

        _fs2.default.writeFile(cssDest, cssString, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

var ensureExists = function ensureExists(filePath) {
    var dirs = _path2.default.dirname(filePath).split(PATH_SEP);
    var result = true;
    var currentPath = void 0;

    if (dirs[0] === '') {
        dirs[0] = _path2.default.sep;
    }

    dirs.forEach(function (_, i, p) {
        currentPath = _path2.default.join.apply(null, p.slice(0, i + 1));
        if (!(0, _ensureFolderExists2.default)(currentPath)) {
            result = false;
        }
    });
    return result;
};

// Hash to keep track of config loaded by path
var configObject = {
    default: {
        configs: {
            classNames: []
        }
    }
};

var parseAndGenerateFile = function parseAndGenerateFile(configPath, source) {
    var validPostcssPlugins = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var minimize = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var sourceHash = arguments[4];

    return new Promise(function (resolve, reject) {
        var firstTrigger = configObject[configPath] || true;

        if (firstTrigger && configPath) {
            configObject[configPath] = require(require.resolve(configPath));
        }

        var pathConfig = configObject[configPath] || configObject.default;
        var foundClasses = atomizer.findClassNames(source);
        var cssDest = pathConfig.cssDest || DEFAULT_CSS_DEST;

        if (!ensureExists(cssDest)) {
            console.warn('[atomic loader] create css failed.');
            return;
        }

        // custom rules file
        if (pathConfig.options && pathConfig.options.rules) {
            var customRules = require(require.resolve(pathConfig.options.rules));
            if (customRules) {
                atomizer.addRules(customRules);
            }
        }

        var finalConfig = atomizer.getConfig(foundClasses, pathConfig.configs || {});
        var cssString = atomizer.getCss(finalConfig, pathConfig.options || {});

        var pipeline = (0, _postcss2.default)(validPostcssPlugins);
        if (minimize) {
            pipeline.use((0, _cssnano2.default)());
        }

        pipeline.process(cssString).then(function (result) {
            var _result$css = result.css,
                css = _result$css === undefined ? '' : _result$css;


            if (css === (cachedResponse || cachedResponses[sourceHash])) {
                return resolve();
            }

            writeCssFile(cssDest, css).then(function () {
                cachedResponse = cachedResponses[sourceHash] = css;
                return resolve();
            }).catch(function (err) {
                return reject(err);
            });
        });
    });
};

var atomicLoader = function atomicLoader(source, map) {
    var callback = this.async();
    var sourceHash = crypto.createHash('md5').update(source).digest('hex');
    if (this.cacheable) {
        this.cacheable();
    }

    if (!cache[sourceHash]) {
        cache[sourceHash] = 1;
    } else {
        return callback(null, source);
    }

    var query = (0, _loaderUtils.getOptions)(this) || {};
    var _query$minimize = query.minimize,
        minimize = _query$minimize === undefined ? false : _query$minimize,
        _query$postcssPlugins = query.postcssPlugins,
        postcssPlugins = _query$postcssPlugins === undefined ? [] : _query$postcssPlugins;

    var validPostcssPlugins = DEFAULT_POSTCSS_PLUGIN_LIST;
    if (Array.isArray(postcssPlugins)) {
        validPostcssPlugins = postcssPlugins;
    }
    var configPaths = query.configPath;
    if (!Array.isArray(configPaths)) {
        configPaths = [configPaths];
    }

    var tasks = configPaths.map(function (configPath) {
        return parseAndGenerateFile(configPath, source, validPostcssPlugins, minimize, sourceHash);
    });

    Promise.all(tasks).then(function () {
        return callback(null, source);
    }).catch(function (err) {
        return callback(err, source);
    });
};

// export default atomicLoader;
module.exports = atomicLoader;