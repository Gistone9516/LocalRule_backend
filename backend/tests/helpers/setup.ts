import { configureGlobal } from 'fast-check';

// Configure fast-check globally: minimum 100 iterations for property tests
configureGlobal({ numRuns: 100 });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

// Global test teardown
afterAll(async () => {
  // Any global cleanup can go here
});

// Reset state between tests
beforeEach(() => {
  jest.clearAllMocks();
});
