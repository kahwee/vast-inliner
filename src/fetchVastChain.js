import fetchXml from './fetchXml'

/**
 * Resolves with a array of this:
 *
 * @param  {[type]} initialUri [description]
 * @return {Promise}            [description]
 */
export default function fetchVastChain (initialUri) {
  return new Promise((resolve, reject) => {
    let vastChain = []
    fetchChainItem(initialUri)
    function fetchChainItem (uri) {
      fetchXml(uri, function (err, resp, body) {
        if (err) {
          reject(err)
        }
        let output = {
          resp
        }
        let vastAdTagURI = body.querySelector('Wrapper VASTAdTagURI')
        if (vastAdTagURI) {
          output.VASTAdTagURI = vastAdTagURI.textContent
          fetchChainItem(output.VASTAdTagURI)
        }
        vastChain.unshift(output)
        if (!vastAdTagURI) {
          resolve(vastChain)
        }
      })
    }
  })
}
