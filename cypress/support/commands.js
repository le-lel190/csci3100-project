// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('loginUser', (identifier = 'test', password = 'test123') => {
  cy.visit('/');
  cy.get('#loginIdentifier').type(identifier);
  cy.get('#loginPassword').type(password);
  cy.get('#loginForm .submit-btn').click();
  
  // Wait for login to complete and redirect
  cy.url().should('include', '/timetable');
});

// Custom command for adding a course to study plan
Cypress.Commands.add('addCourseToStudyPlan', (courseName) => {
  cy.visit('/study-plan');
  cy.get('[data-testid=search-input]').type(courseName);
  cy.get('[data-testid=search-button]').click();
  cy.get('[data-testid=course-item]').contains(courseName).parent().within(() => {
    cy.get('[data-testid=add-to-plan-button]').click();
  });
});

// Custom command for drag and drop (simplified)
Cypress.Commands.add('drag', { prevSubject: 'element' }, (subject, targetSelector, options = {}) => {
  const { index = 0 } = options;
  
  const targetEl = cy.get(targetSelector).eq(index);
  
  cy.wrap(subject)
    .trigger('mousedown', { button: 0 })
    .then(() => {
      targetEl
        .trigger('mousemove')
        .trigger('mouseup', { force: true });
    });
});

//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })