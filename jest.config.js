const nextJest = require("next/jest");

// Avoid Next trying to patch package-lock.json (and fetching registry metadata) during Jest runs.
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = "1";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}", "**/?(*.)+(spec|test).{ts,tsx}"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/playwright-report/", "/test-results/"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
