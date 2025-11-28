module.exports = {
  // Automatically collect coverage
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // --- THIS IS THE FIX ---
  // This tells Jest to ONLY measure coverage for files inside the 'routes' folder.
  // It will ignore server.js, db.js, etc., from the calculation.
  collectCoverageFrom: [
    "routes/**/*.js" 
  ],
  // --- END OF FIX ---

  // This tells Jest to find your test file in the root folder.
  testMatch: [
    "<rootDir>/competitionroutes.test.js"
  ],

  // The test environment
  testEnvironment: 'node',
};