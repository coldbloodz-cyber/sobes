// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = 0; // Use random port for testing
});

afterAll(() => {
  // Cleanup after all tests
  if (global.gc) {
    global.gc();
  }
});

// Increase timeout for performance tests
jest.setTimeout(30000);
