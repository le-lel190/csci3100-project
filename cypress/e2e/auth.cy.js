describe('User Authentication', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    username: `testuser-${Date.now()}`
  };

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