describe('Course Search', () => {
  beforeEach(() => {
    // Use the custom login command
    cy.loginUser();
    
    // Ensure we're on the timetable page
    cy.url().should('include', '/timetable');
    
    // Wait for the page to be fully loaded by checking for key elements
    cy.get('.timetable-header').should('be.visible');
    cy.get('#courseSearch').should('be.visible');
    cy.get('.course-items').should('exist');
  });
  
  it('should search for courses by keyword', () => {
    cy.get('#courseSearch').type('CSCI');
    cy.wait(100); // Wait for search results to load
    cy.get('.course-items').should('be.visible');
    cy.get('.course-items .course-item').should('have.length.greaterThan', 0);
  });
  
  it('should filter course results', () => {
    cy.get('#courseSearch').type('AIST');
    cy.wait(100); // Wait for search results to load
    cy.get('.semester-btn[data-semester="spring"]').click();
    cy.get('.course-items').should('be.visible');
  });
}); 