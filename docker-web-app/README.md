# Docker Web App with MongoDB

A simple web application running in Docker with MongoDB integration.

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

## Services

- Web Application: Running on port 3000
- MongoDB: Running on port 27017

## Stopping the Application

To stop the application, use:
```bash
docker-compose down
```

To stop the application and remove the MongoDB volume, use:
```bash
docker-compose down -v
``` 