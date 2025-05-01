describe('Study Plan Creation', () => {
  beforeEach(() => {
    // Assume we have a custom command for login
    cy.loginUser('testuser@example.com', 'password123');
    cy.visit('/study-plan');
  });
  
  it('should add a course to study plan', () => {
    // First search for a course
    cy.get('[data-testid=search-input]').type('CSCI');
    cy.get('[data-testid=search-button]').click();
    
    // Add the first course to study plan
    cy.get('[data-testid=course-item]').first().within(() => {
      cy.get('[data-testid=add-to-plan-button]').click();
    });
    
    // Verify course was added to study plan
    cy.get('[data-testid=study-plan-courses]').should('contain', 'CSCI');
  });
  
  it('should remove a course from study plan', () => {
    // Assuming there's at least one course in the study plan
    cy.get('[data-testid=study-plan-courses]').within(() => {
      cy.get('[data-testid=course-item]').first().within(() => {
        cy.get('[data-testid=remove-from-plan-button]').click();
      });
    });
    
    // Optional: Verify removal with a confirmation dialog
    cy.get('[data-testid=confirm-dialog]').within(() => {
      cy.get('[data-testid=confirm-button]').click();
    });
    
    // Verify course was removed
    cy.get('[data-testid=study-plan-courses]').should('not.contain', 'CSCI');
  });
  
  it('should reorder courses in study plan', () => {
    // Assuming we have at least 2 courses in the plan
    // Get the text of the first two courses
    let firstCourse, secondCourse;
    
    cy.get('[data-testid=study-plan-courses]').within(() => {
      cy.get('[data-testid=course-item]').eq(0).invoke('text').then(text => {
        firstCourse = text;
      });
      cy.get('[data-testid=course-item]').eq(1).invoke('text').then(text => {
        secondCourse = text;
      });
    });
    
    // Perform drag and drop (simplified, actual implementation would depend on your UI)
    cy.get('[data-testid=study-plan-courses]').within(() => {
      cy.get('[data-testid=course-item]').eq(0).drag('[data-testid=course-item]', { index: 1 });
    });
    
    // Verify the order has changed
    cy.get('[data-testid=study-plan-courses]').within(() => {
      cy.get('[data-testid=course-item]').eq(0).should('contain', secondCourse);
      cy.get('[data-testid=course-item]').eq(1).should('contain', firstCourse);
    });
  });
  
  it('should save study plan changes', () => {
    // Make some changes to the plan
    cy.get('[data-testid=search-input]').type('Data');
    cy.get('[data-testid=search-button]').click();
    cy.get('[data-testid=course-item]').first().within(() => {
      cy.get('[data-testid=add-to-plan-button]').click();
    });
    
    // Save the plan
    cy.get('[data-testid=save-plan-button]').click();
    
    // Verify save was successful
    cy.get('[data-testid=success-message]').should('be.visible');
    
    // Reload the page to verify persistence
    cy.reload();
    
    // Verify the course is still in the plan after reload
    cy.get('[data-testid=study-plan-courses]').should('contain', 'Data');
  });
}); 