describe('Course Search', () => {
  beforeEach(() => {
    cy.visit('/timetable');
  });
  
  it('should search for courses by keyword', () => {
    cy.get('#courseSearch').type('CSCI');
    cy.wait(500);
    cy.get('.course-items').should('be.visible');
    cy.get('.course-items .course-item').should('have.length.greaterThan', 0);
  });
  
  it('should filter course results', () => {
    cy.get('#courseSearch').type('AIST');
    cy.wait(500);
    cy.get('.semester-btn[data-semester="spring"]').click();
    cy.get('.course-items').should('be.visible');
  });
  
  it('should display course details when clicking on a course', () => {
    cy.get('#courseSearch').type('CENG');
    cy.wait(500);
    cy.get('.course-items .course-item').first().click();
    cy.get('.course-details').should('be.visible');
    cy.get('.details-content').should('not.contain', 'Course details will be displayed here');
  });
}); 