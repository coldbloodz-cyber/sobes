# Task 1: Testing Application

## Overview
A RESTful API for task management built with Express.js, featuring comprehensive testing coverage including unit tests, integration tests, edge cases, and performance tests.

## Features
- Complete CRUD operations for tasks
- Task validation and error handling
- Filtering, pagination, and search functionality
- Health check endpoint
- Comprehensive test suite (>90% coverage)

## Quick Start

### Installation
```bash
npm install
```

### Running the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or the port specified in PORT environment variable).

### API Endpoints
- `GET /health` - Health check
- `GET /tasks` - Get all tasks (with filtering, pagination, search)
- `GET /tasks/:id` - Get specific task
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `DELETE /tasks` - Delete all tasks

## Testing

### Run All Tests
```bash
npm test
```

### Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Edge cases and error handling
npm run test:edge

# Performance tests
npm run test:performance

# Test with coverage report
npm run test:coverage

# Load testing with Artillery
npm run test:load
```

### Test Coverage
The test suite includes:
- **Unit Tests**: Validation functions, business logic
- **Integration Tests**: API endpoints, CRUD operations
- **Edge Cases**: Boundary values, error handling, special characters
- **Performance Tests**: Response times, concurrent operations, scalability

Expected coverage: >90%

## Project Structure
```
src/
├── app.js          # Express application setup and routes
└── server.js       # Server startup

tests/
├── unit/           # Unit tests
├── integration/    # API integration tests
├── edge-cases/     # Edge cases and error handling
├── performance/    # Performance and load tests
└── setup.js        # Test configuration

performance-config.yml  # Artillery load testing configuration
jest.config.js          # Jest testing framework configuration
```

## Performance Benchmarks
- Health check: <100ms response time
- CRUD operations: <100ms response time
- Handles 1000+ tasks efficiently
- Concurrent request support
- Memory-efficient operations

## Development Notes
- Built with Node.js and Express.js
- In-memory data storage (for testing purposes)
- Comprehensive validation and error handling
- RESTful API design principles
- Production-ready logging and security middleware
