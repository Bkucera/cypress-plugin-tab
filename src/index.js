const tabSequence = require('ally.js/query/tabsequence')

const { _, Promise } = Cypress

Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject, opts = {}) => {

  const options = _.defaults({}, opts, {
    shift: false,
  })

  debug('subject:', subject)

  if (subject) {
    return performTab(subject[0], options)
  }

  const win = cy.state('window')
  const activeElement = win.document.activeElement

  return performTab(activeElement, options)

})

const performTab = (el, options) => {

  const doc = el.ownerDocument
  const activeElement = doc.activeElement

  const seq = tabSequence({
    strategy: 'quick',
    includeContext: false,
    includeOnlyTabbable: true,
    context: doc.documentElement,
  })

  let index = seq.indexOf(el)

  if (index === -1) {
    if (el && !(el === doc.body)) {
      pluginError(`
        Subject is not a tabbable element
        - Use cy.get(\'body\').tab() if you wish to tab into the first element on the page
        - Use cy.focused().tab() if you wish to tab into the currently active element
      `)
    }
  }

  debug(seq, index)

  /**
   * @type {HTMLElement}
   */
  const newElm = nextItemFromIndex(index, seq, options.shift)

  const simulatedDefault = () => {
    if (newElm.select) {
      newElm.select()
    }

    return cy.now('focus', cy.$$(newElm))
    // newElm.focus()
    // return newElm
  }

  return new Promise((resolve) => {
    doc.defaultView.requestAnimationFrame(resolve)
  }).then(() => {
  // return Promise.try(() => {
    return keydown(activeElement, options, simulatedDefault, () => doc.activeElement)
  }).finally(() => {
    keyup(activeElement, options)
  })

}

const nextItemFromIndex = (i, seq, reverse) => {
  if (reverse) {
    if (i === 0 || i === -1) {
      i = seq.length
    }
  } else {
    if (i === seq.length) {
      i = 0
    }

  }
  // }

  if (reverse) {
    return seq[i - 1]
  }

  return seq[i + 1]
}

const tabKeyEventPartial = {
  key: 'Tab',
  code: 'Tab',
  keyCode: 9,
  which: 9,
  charCode: 0,
}

const fireKeyEvent = (type, el, eventOptionsExtend, bubbles = false, cancelable = false) => {
  const win = el.ownerDocument.defaultView

  const eventInit = _.extend({
    bubbles,
    cancelable,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  }, eventOptionsExtend)

  const keyboardEvent = new win.KeyboardEvent(type, eventInit)

  const cancelled = !el.dispatchEvent(keyboardEvent)

  return cancelled

}

const keydown = (el, options, onSucceed, onCancel) => {

  const eventOptions = _.extend({}, tabKeyEventPartial, {
    shiftKey: options.shift,
  })

  const cancelled = fireKeyEvent('keydown', el, eventOptions, true, true)

  if (cancelled) {
    return onCancel()
  }

  return onSucceed()
}

const keyup = (el, options) => {

  const eventOptions = _.extend({}, tabKeyEventPartial, {
    shiftKey: options.shift,
  })

  return fireKeyEvent('keyup', el, eventOptions, true, false)

}

const pluginError = (mes) => {
  throw new Error(`[cypress-plugin-tab]: ${mes}`)
}

const debug = function () {
  // console.log(...arguments)
}
