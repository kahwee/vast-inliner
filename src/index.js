'use strict'
import Combiner from './Combiner'
import fetchVastChain from './fetchVastChain'

export default function (uri, options = {}) {
  const xmlSerializer = new XMLSerializer()
  return new Promise((resolve, reject) => {
    fetchVastChain(uri).then(data => {
      const c = new Combiner()
      const vastDocs = data.map(vastDoc => vastDoc.resp.body)
      c.setVastDocs(vastDocs)
      const inlinedVastDoc = c.execute()
      if (options.serialize) {
        resolve(xmlSerializer.serializeToString(inlinedVastDoc))
      } else {
        resolve(inlinedVastDoc)
      }
    })
  })
}
