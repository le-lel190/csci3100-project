// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import waitForApp from './wait-for-app'

// Set up specific app behavior
before(() => {
  // Check if the app is running by hitting the base URL with retries
  waitForApp(15, 2000) // Try 15 times with 2-second intervals
  
  // Create test user if needed - this can be expanded based on your API
  // Uncomment and customize once you know your API's structure
  /*
  cy.fixture('testUser').then((user) => {
    cy.request({
      method: 'POST',
      url: '/api/users/register',
      failOnStatusCode: false,
      body: user
    }).then((response) => {
      // Log but don't fail if user already exists
      if (response.status !== 201) {
        cy.log('Test user may already exist or registration failed')
      }
    })
  })
  */
  
  // Setup session to preserve cookies between tests - moved inside the before hook
  cy.session('preserved-session', () => {
    // This is just a placeholder for session setup
    // If you need to set cookies, you'd do it here
  }, {
    // Configure which cookies should be preserved
    validate: () => {
      // No validation required for this basic setup
      return true
    },
    cacheAcrossSpecs: true
  })
})

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false
})