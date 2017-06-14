import Combiner from '../src/Combiner'
import { expect } from 'chai'
import simpleContent from './fixtures/simple.xml'
import wrapperContent from './fixtures/wrapper-1.xml'

describe('Combiner', function () {
  let dp
  let simpleDom
  let wrapperDom

  before(function () {
    dp = new DOMParser()
    simpleDom = dp.parseFromString(simpleContent, 'application/xml')
    wrapperDom = dp.parseFromString(wrapperContent, 'application/xml')
  })

  it('should have tracking events from both simple and its wrapper', function () {
    let c = new Combiner()
    c.unshift(wrapperDom)
    c.unshift(simpleDom)
    const newXml = c.execute()
    expect(wrapperDom.querySelectorAll('Creative Linear Tracking').length + simpleDom.querySelectorAll('Creative Linear Tracking').length).to.equal(newXml.querySelectorAll('Creative Linear Tracking').length)
  })
})
