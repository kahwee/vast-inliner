import fetchXml from '../src/fetchXml'
import { expect } from 'chai'

describe('fetchXml', function () {
  it('should parse into XML', function (done) {
    fetchXml('/base/tests/fixtures/simple.xml', function (err, resp, body) {
      if (err) {
        throw err
      }
      expect(body.querySelector).to.be.defined
      done()
    })
  })

  it('should download correctly', function (done) {
    fetchXml('/base/tests/fixtures/simple.xml', function (err, resp, body) {
      if (err) {
        throw err
      }
      expect(body.querySelector('InLine AdSystem').textContent).to.equal('AdServer')
      done()
    })
  })
})
