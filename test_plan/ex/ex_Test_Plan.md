# **Course Planner - Test Plan**

April 17, 2025

## **Document Revision History**

| Version | Revised By | Revision Date | Comments      |
|---------|------------|---------------|---------------|
| 1.0     | AI Team    | 17 Apr 2025   | Initial draft |

## **1. Scope and Objectives**

### **1.1 Scope:**

The test plan focuses on ensuring the functionality, performance, and user experience of the Course Planner application. The following areas will be tested:

- User authentication and account management
- Course data loading and display
- Study plan creation and management
- Timetable generation and management
- Comment system functionality
- UI/UX across different devices and browsers
- Database operations and data persistence
- API endpoints and server responses
- Security measures for user data

### **1.2 Out of Scope:**

- Testing of third-party integrations not directly related to application functionality
- Hardware-specific performance testing beyond standard web browsers
- Testing of course scraping functionality (handled by separate tools)
- Penetration testing and advanced security audits

### **1.3 Objectives:**

- Verify that the application meets functional and non-functional requirements
- Ensure the application is intuitive, responsive, and free of critical bugs
- Confirm that the application performs well under various conditions (high user load, different browsers)
- Validate that user data is properly stored, retrieved, and protected
- Ensure compatibility across major browsers and devices

## **2. Test Cases and Scenarios**

### **2.1 Example Test Cases for Functional Requirements:**

#### **2.1.1 User Authentication:**

- **Test Case ID:** AUTH-001
  - **Steps:** Navigate to the login page, enter valid credentials, and submit.
  - **Expected Result:** User is authenticated and redirected to the main dashboard.
  - **Pass/Fail Criteria:** User is successfully logged in with correct user data displayed.

- **Test Case ID:** AUTH-002
  - **Steps:** Register a new account with valid information.
  - **Expected Result:** Account is created, and a verification email is sent.
  - **Pass/Fail Criteria:** User account exists in the database and verification email is received.

- **Test Case ID:** AUTH-003
  - **Steps:** Attempt to log in with incorrect credentials.
  - **Expected Result:** Error message is displayed, and login is denied.
  - **Pass/Fail Criteria:** Appropriate error message is shown, and user remains on the login page.

#### **2.1.2 Course Management:**

- **Test Case ID:** COURSE-001
  - **Steps:** Load the course catalog for a specific semester.
  - **Expected Result:** Courses for that semester are displayed with correct information.
  - **Pass/Fail Criteria:** Course data matches the expected data in the database.

- **Test Case ID:** COURSE-002
  - **Steps:** Search for a course by code or name.
  - **Expected Result:** Matching courses are displayed.
  - **Pass/Fail Criteria:** Search results are accurate and displayed promptly.

#### **2.1.3 Study Plan Management:**

- **Test Case ID:** PLAN-001
  - **Steps:** Add a course to the study plan for a specific year and semester.
  - **Expected Result:** Course is added to the study plan.
  - **Pass/Fail Criteria:** Course appears in the correct year and semester in the study plan view.

- **Test Case ID:** PLAN-002
  - **Steps:** Remove a course from the study plan.
  - **Expected Result:** Course is removed from the study plan.
  - **Pass/Fail Criteria:** Course no longer appears in the study plan.

#### **2.1.4 Timetable Management:**

- **Test Case ID:** TIMETABLE-001
  - **Steps:** Add courses to a timetable for a specific semester.
  - **Expected Result:** Courses are added to the timetable with correct time slots.
  - **Pass/Fail Criteria:** Courses appear in the correct time slots in the timetable view.

- **Test Case ID:** TIMETABLE-002
  - **Steps:** Save a timetable and reload the page.
  - **Expected Result:** Timetable is saved and loaded correctly.
  - **Pass/Fail Criteria:** Timetable data persists after page reload.

#### **2.1.5 Comment System:**

- **Test Case ID:** COMMENT-001
  - **Steps:** Add a comment to a course.
  - **Expected Result:** Comment is added and displayed.
  - **Pass/Fail Criteria:** Comment appears in the course's comment section.

- **Test Case ID:** COMMENT-002
  - **Steps:** Edit or delete a user's own comment.
  - **Expected Result:** Comment is edited or deleted.
  - **Pass/Fail Criteria:** Changes to the comment are persistent.

### **2.2 Example Test Cases for Non-Functional Requirements:**

#### **2.2.1 Performance Testing:**

- **Test Case ID:** PERF-001
  - **Objective:** Verify that the application loads within acceptable time.
  - **Steps:** Measure the time taken to load the main page and course data.
  - **Expected Result:** Main page loads in under 3 seconds, course data loads in under 5 seconds.
  - **Pass/Fail Criteria:** Loading times are within acceptable ranges.

- **Test Case ID:** PERF-002
  - **Objective:** Test application performance under load.
  - **Steps:** Simulate multiple concurrent users accessing the application.
  - **Expected Result:** Application remains responsive with minimal degradation.
  - **Pass/Fail Criteria:** Response times increase by no more than 50% under load.

#### **2.2.2 Usability Testing:**

- **Test Case ID:** USAB-001
  - **Objective:** Verify that the UI is intuitive for new users.
  - **Steps:** Ask new users to complete common tasks without instruction.
  - **Expected Result:** Users can navigate and use the application with minimal confusion.
  - **Pass/Fail Criteria:** Users complete tasks without significant guidance.

- **Test Case ID:** USAB-002
  - **Objective:** Ensure the application is responsive on different devices.
  - **Steps:** Test the application on desktop, tablet, and mobile devices.
  - **Expected Result:** UI adapts appropriately to different screen sizes.
  - **Pass/Fail Criteria:** All features are accessible and usable on all tested devices.

#### **2.2.3 Reliability Testing:**

- **Test Case ID:** REL-001
  - **Objective:** Verify that user data is persistent.
  - **Steps:** Create and save a study plan and timetable, then log out and log back in.
  - **Expected Result:** Previously saved data is correctly loaded.
  - **Pass/Fail Criteria:** All user data is preserved between sessions.

#### **2.2.4 Security Testing:**

- **Test Case ID:** SEC-001
  - **Objective:** Ensure authentication is required for protected routes.
  - **Steps:** Attempt to access protected routes without authentication.
  - **Expected Result:** Access is denied and user is redirected to login.
  - **Pass/Fail Criteria:** Unauthenticated users cannot access protected resources.

- **Test Case ID:** SEC-002
  - **Objective:** Verify that passwords are securely stored.
  - **Steps:** Examine the database to ensure passwords are hashed.
  - **Expected Result:** Passwords in the database are hashed, not stored in plaintext.
  - **Pass/Fail Criteria:** All passwords are properly hashed.

#### **2.2.5 Compatibility Testing:**

- **Test Case ID:** COMP-001
  - **Objective:** Ensure compatibility with major browsers.
  - **Steps:** Test the application on Chrome, Firefox, Safari, and Edge.
  - **Expected Result:** Application functions consistently across all browsers.
  - **Pass/Fail Criteria:** No browser-specific issues are found.

## **3. Resource Allocation**

### **3.1 Team Roles and Responsibilities:**

| Role                   | Name        | Responsibilities                                              | Time Commitment |
|------------------------|-------------|--------------------------------------------------------------|-----------------|
| Test Lead              | TL          | Oversee testing, manage team, report progress                 | Full-time       |
| QA Tester              | QA1         | Execute test cases, log bugs, perform regression              | Full-time       |
| QA Tester              | QA2         | Focus on UI/UX testing and compatibility                      | Part-time       |
| Automation Engineer    | AE          | Develop and maintain automated test scripts                   | Part-time       |
| Developer              | DEV         | Perform unit testing, assist with integration issues          | As needed       |
| UI/UX Designer         | UX          | Validate UI/UX and accessibility                             | Part-time       |
| DevOps Engineer        | OPS         | Maintain test environments and CI/CD pipelines                | As needed       |
| Product Owner          | PO          | Validate requirements and acceptance criteria                 | As needed       |

### **3.2 Tools and Software:**

- **Test Management Tools:**
  - GitHub Issue Tracker for test case management and bug tracking
  - GitHub Actions for CI/CD automation

- **Automation Tools:**
  - Jest for automated unit and integration testing
  - Cypress for end-to-end testing

- **Performance Testing Tools:**
  - Lighthouse for web performance analysis
  - JMeter for load testing

- **Browser Testing Tools:**
  - BrowserStack for cross-browser testing

- **Version Control:**
  - Git for source code and test script management

### **3.3 Testing Environments:**

| Environment  | Purpose                                 | Tools/Resources                           | Owner           |
|--------------|------------------------------------------|--------------------------------------------|-----------------|
| Development  | Unit testing, debugging                  | Local development setup, mock databases     | Developers      |
| Staging      | System and regression testing            | Containerized application, test databases   | QA Team         |
| Production   | Final validation and UAT                 | Production-like setup                       | Product Owner   |

### **3.4 Time Allocation:**

| Activity                | Effort (%) | Responsible Team Member(s)       |
|-------------------------|------------|----------------------------------|
| Test Planning           | 10%        | Test Lead                        |
| Test Case Creation      | 15%        | QA Testers                       |
| Test Execution          | 50%        | QA Testers, Automation Engineers |
| Bug Reporting/Retesting | 20%        | QA Testers, Developers           |
| Regression Testing      | 15%        | QA Testers, Automation Engineers |

## **4. Testing Approach**

### **4.1 Types of Testing:**

- **Unit Testing:** Individual components (e.g., authentication functions, API handlers)
- **Integration Testing:** Interactions between different modules (e.g., user authentication and database, course data and UI)
- **System Testing:** End-to-end functionality from user perspective
- **Regression Testing:** Ensure new updates do not break existing functionality
- **User Acceptance Testing (UAT):** Gather feedback from actual users

### **4.2 Methodologies:**

- **Automated Testing:** For repetitive tasks, regression testing, and CI/CD pipeline
- **Manual Testing:** For exploratory testing, usability, and complex user interactions
- **Behavior-Driven Development (BDD):** For feature testing with scenarios defined in natural language

## **5. Timeline and Schedule**

### **5.1 Agile Model Timeline:**

Since this project follows an Agile development model, testing will be integrated throughout the development process in 2-week sprints.

| Day     | Activity                                                                             |
|---------|--------------------------------------------------------------------------------------|
| Day 1   | Sprint planning, define acceptance criteria, write initial test cases                |
| Day 2-3 | Set up test environment, develop automated tests for new features                    |
| Day 4-7 | Execute test cases for completed user stories, log bugs, perform regression testing  |
| Day 8   | Mid-sprint integration testing, update test cases, exploratory testing               |
| Day 9   | Final acceptance testing, system testing, prepare for demo                           |
| Day 10  | Sprint review/demo, retrospective, prepare test summary report                       |

### **5.2 Key Milestones:**

- Complete unit test suite for core functionality (User authentication, Course management)
- Establish automated testing pipeline with CI/CD integration
- Complete end-to-end test suite for critical user journeys
- Perform comprehensive performance and security testing before release
- Conduct UAT with actual users prior to final release

## **6. Risk Assessment and Mitigation**

### **6.1 Potential Risks:**

| Risk                                | Impact    | Probability | Mitigation Strategy                                           |
|-------------------------------------|-----------|------------|--------------------------------------------------------------|
| Course data loading issues          | High      | Medium     | Create robust error handling, implement data validation       |
| Performance issues with large datasets | High   | Medium     | Implement pagination, optimize database queries               |
| Browser compatibility issues        | Medium    | Low        | Test on all major browsers, use standard web technologies     |
| User authentication security vulnerabilities | High | Low    | Regular security audits, follow security best practices      |
| Database connection failures        | High      | Low        | Implement retry mechanisms, proper error handling            |
| Undetected bugs in complex features | Medium    | Medium     | Thorough testing of edge cases, code reviews                 |

## **7. Success Criteria**

- All critical and high-priority test cases pass
- Zero known security vulnerabilities
- Application loads and responds within defined performance benchmarks
- User data is persistently and correctly stored
- UI/UX is consistent across supported browsers and devices
- All API endpoints return appropriate responses and status codes
- Positive feedback from UAT participants
- No regressions in existing functionality

## **8. Reporting Requirements**

### **8.1 Documentation:**

- Test case documentation in GitHub repository
- Bug reports with reproduction steps, severity, and priority
- Test execution reports after each sprint
- Performance test results for critical features
- Security audit findings

### **8.2 Communication:**

- Daily standup meetings during active testing phases
- Weekly test progress reports to stakeholders
- Immediate notification for critical bugs
- End-of-sprint testing summary as part of sprint review 