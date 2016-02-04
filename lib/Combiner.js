'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var _this = this;

  this.vastDocs = [];
  return {
    unshift: function unshift(dom) {
      _this.vastDocs.unshift(dom);
    },
    setVastDocs: function setVastDocs(vastDocs) {
      _this.vastDocs = vastDocs;
    },
    execute: function execute() {
      return _this.vastDocs.reduce(function (previousValue, currentValue) {
        // Carry over TrackingEvents
        var trackingEvents = previousValue.querySelector('InLine Creative Linear TrackingEvents');
        [].concat(_toConsumableArray(currentValue.querySelectorAll('Wrapper Creative Linear TrackingEvents Tracking'))).forEach(function (node) {
          trackingEvents.appendChild(node);
        });
        var inLine = previousValue.querySelector('InLine');
        [].concat(_toConsumableArray(currentValue.querySelectorAll('Wrapper Impression'))).forEach(function (node) {
          inLine.appendChild(node);
        });
        [].concat(_toConsumableArray(currentValue.querySelectorAll('Wrapper Error'))).forEach(function (node) {
          inLine.appendChild(node);
        });
        return previousValue;
      });
    }
  };
};

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }