import fetchXml from '../src/fetchXml'
import { expect } from 'chai'
const fs = require('fs')

describe.only('fetchXml', function () {

  it('should parse into XML', function (done) {
    fetchXml('/base/tests/fixtures/simple.xml', function(err, resp, body) {
      expect(body.querySelector).to.be.defined
      done()
    })
  })

  it('should download correctly', function (done) {
    fetchXml('/base/tests/fixtures/simple.xml', function(err, resp, body) {
      expect(body.querySelector('InLine AdSystem').textContent).to.equal('AdServer')
      done()
    })
  })
})
