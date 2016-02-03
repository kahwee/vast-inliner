'use strict'

export default function () {
  let vastDocs = []
  return {
    add: (dom) => {
      vastDocs.unshift(dom)
    },
    execute: () => {
      return vastDocs.reduce((previousValue, currentValue) => {
        // Carry over TrackingEvents
        let trackingEvents = previousValue.querySelector('InLine Creative Linear TrackingEvents');
        [...currentValue.querySelectorAll('Wrapper Creative Linear TrackingEvents Tracking')].forEach(node => {
          trackingEvents.appendChild(node)
        })
        let inLine = previousValue.querySelector('InLine');
        [...currentValue.querySelectorAll('Wrapper Impression')].forEach(node => {
          inLine.appendChild(node)
        });
        [...currentValue.querySelectorAll('Wrapper Error')].forEach(node => {
          inLine.appendChild(node)
        })
        return previousValue
      })
    }
  }
}
