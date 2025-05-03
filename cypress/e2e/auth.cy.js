/**
 * User Authentication E2E Tests
 * 
 * These tests verify the authentication flow including:
 * - User registration
 * - Login with valid and invalid credentials
 * - Logout functionality
 * 
 * Tests use direct API calls rather than UI interaction to verify the auth endpoints.
 */
describe('User Authentication', () => {
  /**
   * Test user data with unique values generated for each test run
   * to prevent conflicts in the database
   */
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    username: `testuser-${Date.now()}`
  };

  /**
   * Test case: User registration
   * - Makes a POST request to the registration endpoint
   * - Verifies successful user creation with 201 status
   */
  it('should register a new user', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password
      }
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.include('User created successfully');
    });
  });

  /**
   * Test case: Successful login
   * - Attempts to log in with valid credentials
   * - Verifies 200 status and correct user data in response
   */
  it('should log in with valid credentials', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        identifier: testUser.email,
        password: testUser.password
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.message).to.eq('Logged in successfully');
      expect(response.body.user).to.have.property('username', testUser.username);
    });
  });

  /**
   * Test case: Failed login
   * - Attempts to log in with invalid credentials
   * - Verifies 401 status and appropriate error message
   * - Uses failOnStatusCode: false to prevent Cypress from failing on non-2xx status
   */
  it('should not log in with invalid credentials', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        identifier: testUser.email,
        password: 'WrongPassword123!'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.eq('Invalid credentials');
    });
  });

  /**
   * Test case: User logout
   * - First logs in to create an authenticated session
   * - Then makes a request to the logout endpoint
   * - Verifies successful logout with 200 status
   */
  it('should log out the user', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        identifier: testUser.email,
        password: testUser.password
      }
    }).then((loginResponse) => {
      expect(loginResponse.status).to.eq(200);
      
      cy.request({
        method: 'POST',
        url: '/api/auth/logout'
      }).then((logoutResponse) => {
        expect(logoutResponse.status).to.eq(200);
        expect(logoutResponse.body.message).to.eq('Logged out successfully');
      });
    });
  });
}); 