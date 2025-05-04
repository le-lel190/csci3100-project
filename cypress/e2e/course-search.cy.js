/**
 * Course Search E2E Tests
 * 
 * These tests verify the functionality of the course search feature,
 * including keyword searching and filtering options.
 */
describe('Course Search', () => {
  /**
   * Before each test:
   * - Log in with default test credentials
   * - Verify navigation to the timetable page
   * - Ensure key UI elements are loaded and visible
   */
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
  
  /**
   * Test case: Searching for courses by keyword
   * - Enter a department code in the search field
   * - Verify search results appear
   * - Confirm at least one course is returned
   */
  it('should search for courses by keyword', () => {
    cy.get('#courseSearch').type('CSCI');
    cy.wait(100); // Wait for search results to load
    cy.get('.course-items').should('be.visible');
    cy.get('.course-items .course-item').should('have.length.greaterThan', 0);
  });
  
  /**
   * Test case: Filtering course search results
   * - Search for courses in a specific department
   * - Apply a semester filter (spring)
   * - Verify filtered results are displayed
   */
  it('should filter course results', () => {
    cy.get('#courseSearch').type('AIST');
    cy.wait(100); // Wait for search results to load
    cy.get('.semester-btn[data-semester="spring"]').click();
    cy.get('.course-items').should('be.visible');
  });
}); 