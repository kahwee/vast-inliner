require('babel-register')
import fetchVastChain from '../src/fetchVastChain'
import { expect } from 'chai'
const fs = require('fs')

describe('fetchVastChain', function () {

  describe('test Wrapper -> InLine', function () {
    let data
    before (function (done) {
      fetchVastChain ('/base/tests/fixtures/wrapper-1.xml').then(data2 => {
        data = data2
        done()
      })
    })

    it('should download 2 files', function () {
        expect(data).to.be.length(2)
    })

    it('should be positioned correctly', function () {
      expect(data[1].VASTAdTagURI).to.be.not.undefined
      expect(data[0].VASTAdTagURI).to.be.undefined
    })
  })

  describe('test Wrapper -> Wrapper -> InLine', function () {
    let data
    before (function (done) {
      fetchVastChain ('/base/tests/fixtures/wrapper-2.xml').then(data2 => {
        data = data2
        done()
      })
    })

    it('should download 3 files', function () {
        expect(data).to.be.length(3)
    })

    it('should be positioned correctly', function () {
      expect(data[2].VASTAdTagURI).to.be.not.undefined
      expect(data[1].VASTAdTagURI).to.be.not.undefined
      expect(data[0].VASTAdTagURI).to.be.undefined
    })
  })

})
