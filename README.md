# AIO - Course Planner

A comprehensive web application for planning and managing academic courses, running in Docker with MongoDB integration.

## Overview

AIO - Course Planner helps students and academic advisors organize course schedules, track requirements, and plan academic paths efficiently. The application provides an intuitive interface for managing course data and planning academic terms.

## Prerequisites

- Docker
- Docker Compose

## Running the Application

1. Clone this repository
2. Navigate to the project directory
3. Run the following command:
   ```bash
   docker-compose up --build
   ```

The application will be available at http://localhost:3000

## Features

- Course catalog browsing and searching
- Academic term planning
- Prerequisite checking
- Requirement tracking
- Schedule visualization
- Data import/export capabilities

## Project Structure

- **course-data/**: Contains course information and resources
- **src/**: Application source code
- **tools/**: Utility scripts and course data scraper (taken from [CUtopia](https://github.com/cutopia-labs/CUtopia/tree/master/tools), disclaimer is located at [DISCLAIMER.md](DISCLAIMER.md))
- **cypress/**: End-to-end testing framework

## Services

- **Web Application**: Running on port 3000
  - Express.js backend
  - MongoDB integration
  - User authentication
  
- **MongoDB**: Running on port 27017
  - Stores course data, user profiles, and schedules

## Stopping the Application

To stop the application, use:
```bash
docker-compose down
```

To stop the application and remove the MongoDB volume, use:
```bash
docker-compose down -v
```

## Testing

To run tests using Cypress:
```bash
npm run cypress:open
```

For headless testing:
```bash
npm run cypress:run
``` 