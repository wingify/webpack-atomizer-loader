'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ensureFolderExists = function ensureFolderExists(path, mask) {
    mask = mask || '0777';
    try {
        _fs2.default.mkdirSync(path, mask);
        return true;
    } catch (err) {
        if (err.code === 'EEXIST') {
            return true;
        } else {
            return false;
        }
    }
};

exports.default = ensureFolderExists;