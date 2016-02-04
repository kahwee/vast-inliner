import Combiner from '../src/Combiner'
import { expect } from 'chai'
const fs = require('fs')

describe('Combiner', function () {
  const simpleContent = fs.readFileSync(`${__dirname}/fixtures/simple.xml`, {
    encoding: 'utf8'
  })
  const wrapperContent = fs.readFileSync(`${__dirname}/fixtures/wrapper.xml`, {
    encoding: 'utf8'
  })
  let dp
  let xs
  let simpleDom
  let wrapperDom

  before(function () {
    dp = new DOMParser()
    xs = new XMLSerializer()
    simpleDom = dp.parseFromString(simpleContent, 'application/xml')
    wrapperDom = dp.parseFromString(wrapperContent, 'application/xml')
  })

  it('should have tracking events from both simple and its wrapper', function () {
    let c = new Combiner()
    c.add(wrapperDom)
    c.add(simpleDom)
    const newXml = c.execute()
    expect(wrapperDom.querySelectorAll('Creative Linear Tracking').length + simpleDom.querySelectorAll('Creative Linear Tracking').length).to.equal(newXml.querySelectorAll('Creative Linear Tracking').length)
    // console.log(xs.serializeToString(newXml))
  })
})
