'use strict'

import xhr from 'xhr'

export default function fetchXml (uri, options = {}, cb) {
  let opts = {
    uri: uri,
    responseType: 'document',
    headers: {
      'Content-Type': 'application/xml'
    }
  }
  if (options.withCredentials) {
    opts.withCredentials = options.withCredentials
  }
  if (options.timeout) {
    opts.timeout = options.timeout
  }
  xhr(opts, function (err, resp, body) {
    cb(err, resp, body)
  })
}
