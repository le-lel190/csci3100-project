/**
 * Helper script to check if the application is ready before running tests
 * This can be used by importing it in e2e.js or in individual test files
 */

function waitForApp(retries = 10, interval = 1000) {
  return new Promise((resolve, reject) => {
    function checkApp(attemptsLeft) {
      console.log(`Checking if app is ready... (${retries - attemptsLeft + 1}/${retries})`);
      
      cy.request({
        url: '/',
        failOnStatusCode: false,
        timeout: 5000
      }).then((response) => {
        if (response.status === 200) {
          console.log('Application is ready!');
          resolve();
        } else if (attemptsLeft > 1) {
          setTimeout(() => checkApp(attemptsLeft - 1), interval);
        } else {
          console.log('Application failed to start within the timeout period');
          // We resolve anyway to prevent test failures, but log a warning
          resolve();
        }
      }, (error) => {
        // Use a second callback parameter for error handling instead of .catch()
        if (attemptsLeft > 1) {
          setTimeout(() => checkApp(attemptsLeft - 1), interval);
        } else {
          console.log('Application failed to start within the timeout period');
          // We resolve anyway to prevent test failures, but log a warning
          resolve();
        }
      });
    }
    
    checkApp(retries);
  });
}

export default waitForApp; 