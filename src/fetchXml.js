'use strict'

import xhr from 'xhr'

export default function fetchXml (uri, cb) {
  xhr({
    uri: uri,
    responseType: 'document',
    headers: {
      'Content-Type': 'application/xml'
    }
  }, function (err, resp, body) {
    cb(err, resp, body)
  })
}
