/// <reference types="cypress"/>

// const { _ } = Cypress

describe('tabindex -1 test', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/tabindex.html')
  });

  describe('Move focus away from tabindex -1 element', () => {
    beforeEach(() => {
      cy.get('#title')
        .focus()
        .should('have.focus');
    });

    it('Should focus content link after tab', () => {
      cy.focused().tab();

      cy.get('#contentLink')
        .should('have.focus');
    });

    it('Should focus skip link before tab', () => {
      cy.focused().tab({ shift: true });

      cy.get('#skipLink')
        .should('have.focus');
    });
  });

  describe('Tab should skip -1 element', () => {
    it('Follows expected tab order', () => {
      cy.get('body')
        .tab();
  
      cy.get('#skipLink')
        .should('have.focus');
  
      cy.focused().tab();
  
      cy.get('#contentLink')
        .should('have.focus');
    });
  });

  describe('Focus a non-focusable element', () => {
    it('Should return an error message', () => {
      cy.get('#subtitle').focus();

      cy.focused().tab();
    })
  })
})

describe.skip('form test', () => {

  beforeEach(() => {
    cy.visit('/cypress/fixtures/forms.html')
  })

  it('can tab', () => {
    cy.get('body').tab().tab().tab().then(beFocused)

    cy.get('.navbar-brand').should(beFocused)
  })

  it('can tab from element', () => {
    cy.get('input:first').tab().tab().tab()
    cy.get(':nth-child(3) > .bd-toc-link').should(beFocused)
  })

  it('throws on non-tabbable subject', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).contain('not a tabbable')
      done()
    })

    cy.get('body').tab().tab()
    cy.tab()
    cy.get('header:first').tab()

  })

  // tab will respect element nearest to selection
  // in window.getSelection().baseNode, but this is complex

  // it('can tab from selection', () => {
  //   cy.get('header.navbar').tab()
  //   cy.get('.navbar-brand').should(beFocused)

  //   cy.get('.bd-example form:first').tab()
  //   cy.get('.col-md-9 > :nth-child(6)').tab()
  //   cy.get('.bd-example form:first input:first').should(beFocused)
  // })

  // this is slow, obviously
  // it('can tab 31 times', () => {
  //   const tab = (el) => el.tab()
  //   let body = cy.get('body')

  //   // tab(tab(body))
  //   _.times(31, () => {
  //     body = tab(body)
  //   })
  //   cy.contains('Jumbotron').should(beFocused)
  // })

  it('can shift-tab', () => {
    cy.get('body').tab({ shift: true })
    cy.get('a:last').should(beFocused)
  })

  it('selects text in input', () => {
    cy.get('input#search-input').type('foobar').tab().tab({ shift: true })
    cy.window().then((win) => {
      expect(selectedText(win)).eq('foobar')
    })
  })

  it('can tab from focus', () => {
    cy.get('#overview > div > .anchorjs-link').focus().tab().tab()

    cy.get('.bd-example form input:first').should(beFocused)
  })

  it('can be cancelled', () => {
    cy.get('body').should(($el) => {
      return $el.on('keydown', (e) => e.preventDefault())
    })

    cy.get('body').tab().tab().tab()

    cy.get('body').should(beFocused)
  })

  it('can be cancelled and yield activeElement', () => {
    cy.get('body').should(($el) => {
      return $el.on('keydown', (e) => e.preventDefault())
    })

    cy.get('body').tab().tab().tab().then(beFocused)

    cy.get('body').should(beFocused)
  })

  it('moves focus back to the first element when the last element is focused', () => {
    cy.get('a:last').tab()
    cy.get('a:first').should(beFocused)
  })

  it('moves focus back to the first element when the last element is focused', () => {
    cy.get('a:first').tab({ shift: true })
    cy.get('a:last').should(beFocused)
  })

  describe('events', () => {
    beforeEach(() => {

      cy.document().then((doc) => {
        const keydownStub = cy.stub()
        // .callsFake((e) => {
        //   console.log('keydown, Target:', e.target, e)
        // })
        .as('keydown')
        const keyupStub = cy.stub()
        // .callsFake((e) => {
        //   // console.log('keyup, Target:', e.target, e)
        // })
        .as('keyup')

        doc.addEventListener('keydown', keydownStub)
        doc.addEventListener('keyup', keyupStub)
      })
    })

    it('sends keydown event', () => {
      cy.get('body').tab().tab()
      cy.get('@keydown').should('be.calledTwice')
    })

    it('sends keyup event', () => {
      cy.get('body').tab().tab()
      cy.get('@keydown').should('be.calledTwice')
    })

    it('uses RAF for a delay', (done) => {
      let hasTripped = false
      let counter = 0

      cy.$$('body').on('keydown', () => {
        counter++

        if (counter === 1) {
          cy.state('window').requestAnimationFrame(() => {
            hasTripped = true
          })

          return
        }

        expect(hasTripped).ok
        done()
      })

      cy.get('body').tab().tab()
    })
  })
})

const beFocused = ($el) => {
  const el = $el[0]
  const activeElement = cy.state('document').activeElement

  expect(el, 'activeElement').eq(activeElement)
}

const selectedText = () => {
  const selectedText = cy.state('document').getSelection().toString()

  if (selectedText) return selectedText

  /**
   * @type {HTMLInputElement}
   */
  const activeElement = cy.state('document').activeElement

  let selectedTextIsValue = false

  try {
    selectedTextIsValue = activeElement.selectionStart === 0 && activeElement.selectionEnd === activeElement.value.length
  } finally {
    //
  }

  if (selectedTextIsValue) {
    return activeElement.value
  }

  return ''

}
