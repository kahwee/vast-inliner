'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (uri) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var xmlSerializer = new XMLSerializer();
  return new Promise(function (resolve, reject) {
    (0, _fetchVastChain2.default)(uri).then(function (data) {
      var c = new _Combiner2.default();
      var vastDocs = data.map(function (vastDoc) {
        return vastDoc.resp.body;
      });
      c.setVastDocs(vastDocs);
      var inlinedVastDoc = c.execute();
      if (options.serialize) {
        resolve(xmlSerializer.serializeToString(inlinedVastDoc));
      } else {
        resolve(inlinedVastDoc);
      }
    });
  });
};

var _Combiner = require('./Combiner');

var _Combiner2 = _interopRequireDefault(_Combiner);

var _fetchVastChain = require('./fetchVastChain');

var _fetchVastChain2 = _interopRequireDefault(_fetchVastChain);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }