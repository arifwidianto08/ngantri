import "@testing-library/jest-dom";

// Mock uuid for tests
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-1234"),
  v7: jest.fn(() => "test-uuid-v7-1234"),
}));

// Note: Contract tests will use fetch API - for now we'll skip the polyfill
// and expect Node.js 18+ built-in fetch support
