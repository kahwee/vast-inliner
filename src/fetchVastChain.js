import fetchXml from './fetchXml'

/**
 * Resolves with a array of this:
 *
 * @param  {[type]} initialUri [description]
 * @return {Promise}            [description]
 */
/**
 * Resolves with a array of this:
 * @param  {[type]} initialUri [description]
 * @param  {[type]} options    Valid options and `timeout` and `withCredentials`
 * @return {[type]}            [description]
 */
export default function fetchVastChain (initialUri, options = {}) {
  return new Promise((resolve, reject) => {
    let vastChain = []
    fetchChainItem(initialUri)
    function fetchChainItem (uri, options) {
      fetchXml(uri, options, function (err, resp, body) {
        if (err) {
          console.log(err)
          reject(err)
        }
        let output = {
          resp
        }
        let vastAdTagURI = body.querySelector('Wrapper VASTAdTagURI')
        if (vastAdTagURI) {
          output.VASTAdTagURI = vastAdTagURI.textContent
          fetchChainItem(output.VASTAdTagURI, options)
        }
        vastChain.unshift(output)
        if (!vastAdTagURI) {
          resolve(vastChain)
        }
      })
    }
  })
}
