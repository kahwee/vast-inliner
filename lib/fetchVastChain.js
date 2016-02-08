'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fetchVastChain;

var _fetchXml = require('./fetchXml');

var _fetchXml2 = _interopRequireDefault(_fetchXml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Resolves with a array of this:
 *
 * @param  {[type]} initialUri [description]
 * @return {Promise}            [description]
 */
/**
 * Resolves with a array of this:
 * @param  {[type]} initialUri [description]
 * @param  {[type]} options    Valid options and `timeout` and `withCredentials`
 * @return {[type]}            [description]
 */
function fetchVastChain(initialUri) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  return new Promise(function (resolve, reject) {
    var vastChain = [];
    fetchChainItem(initialUri);
    function fetchChainItem(uri, options) {
      (0, _fetchXml2.default)(uri, options, function (err, resp, body) {
        if (err) {
          console.log(err);
          reject(err);
        }
        var output = {
          resp: resp
        };
        var vastAdTagURI = body.querySelector('Wrapper VASTAdTagURI');
        if (vastAdTagURI) {
          output.VASTAdTagURI = vastAdTagURI.textContent;
          fetchChainItem(output.VASTAdTagURI, options);
        }
        vastChain.unshift(output);
        if (!vastAdTagURI) {
          resolve(vastChain);
        }
      });
    }
  });
}