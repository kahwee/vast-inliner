'use strict'
import Combiner from './Combiner'
import fetchVastChain from './fetchVastChain'

export default function (uri, serialize = true) {
  const xmlSerializer = new XMLSerializer()
  return new Promise((resolve, reject) => {
    fetchVastChain(uri).then(data => {
      const c = new Combiner()
      const vastDocs = data.map(vastDoc => vastDoc.resp.body)
      c.setVastDocs(vastDocs)
      const inlinedVastDoc = c.execute()
      if (serialize) {
        resolve(xmlSerializer.serializeToString(inlinedVastDoc))
      } else {
        resolve(inlinedVastDoc)
      }
    })
  })
}
