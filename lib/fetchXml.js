'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fetchXml;

var _xhr = require('xhr');

var _xhr2 = _interopRequireDefault(_xhr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fetchXml(uri, cb) {
  (0, _xhr2.default)({
    uri: uri,
    responseType: 'document',
    headers: {
      'Content-Type': 'application/xml'
    }
  }, function (err, resp, body) {
    cb(err, resp, body);
  });
}