/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  preset: "ts-jest",
  roots: ["<rootDir>/lib"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "lib/**/*.ts",
    "!lib/**/*.d.ts",
    "!lib/**/__tests__/**",
  ],
};

module.exports = config;
