/**
 * Concept Dependency Mapper - Appium Mobile E2E Test Suite Runner
 * File: appium-tests/app-login-tests.js
 *
 * Forwards execution to tests/app-login-tests.js
 */

const AppiumMobileTestRunner = require('./tests/app-login-tests.js');

if (require.main === module) {
  const runner = new AppiumMobileTestRunner();
  runner.runAllMobileTests().catch((err) => {
    console.error('Fatal Appium Execution Failure:', err);
    process.exit(1);
  });
}

module.exports = AppiumMobileTestRunner;
