'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fetchXml;

var _xhr = require('xhr');

var _xhr2 = _interopRequireDefault(_xhr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fetchXml(uri) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var cb = arguments[2];

  var opts = {
    uri: uri,
    responseType: 'document',
    withCredentials: !!options.withCredentials
  };
  if (options.timeout) {
    opts.timeout = options.timeout;
  }
  (0, _xhr2.default)(opts, function (err, resp, body) {
    cb(err, resp, body);
  });
}