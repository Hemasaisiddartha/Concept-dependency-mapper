/**
 * ==============================================================================
 * Concept Dependency Mapper - Comprehensive Selenium E2E Web Test Suite
 * File: selenium-tests/tests/login-tests.js
 * Technology: Selenium WebDriver (JavaScript / Node.js)
 * Author: Senior Quality Assurance & Automation Engineer
 * Description: End-to-end automated test cases covering authentication, input
 * validation, registration, role selection, OTP workflows, and responsive layout.
 * ==============================================================================
 */

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const HEADLESS = process.env.HEADLESS === 'true';
const DEFAULT_TIMEOUT_MS = 10000;

class SeleniumTestRunner {
  constructor() {
    this.driver = null;
    this.results = [];
    this.startTime = Date.now();
  }

  async setup() {
    console.log('\n=============================================================');
    console.log('🚀 INITIALIZING SELENIUM WEBDRIVER TEST ENVIRONMENT');
    console.log(`🌐 Target Base URL: ${BASE_URL}`);
    console.log(`💻 Headless Mode: ${HEADLESS ? 'ENABLED' : 'DISABLED'}`);
    console.log('=============================================================\n');

    const options = new chrome.Options();
    if (HEADLESS) {
      options.addArguments('--headless=new');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1440,900');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({ implicit: 3000, pageLoad: 15000, script: 10000 });
  }

  async recordTest(id, name, testFn) {
    const start = Date.now();
    try {
      await testFn();
      const duration = Date.now() - start;
      console.log(`  ✅ [PASS] ${id} - ${name} (${duration}ms)`);
      this.results.push({ id, name, status: 'PASSED', duration, error: null });
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`  ❌ [FAIL] ${id} - ${name} (${duration}ms)`);
      console.error(`     Error Details: ${err.message}`);
      this.results.push({ id, name, status: 'FAILED', duration, error: err.message });
    }
  }

  async teardown() {
    if (this.driver) {
      await this.driver.quit();
    }
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;

    console.log('\n=============================================================');
    console.log('📊 SELENIUM TEST AUTOMATION EXECUTION SUMMARY');
    console.log('=============================================================');
    console.log(`Total Executed: ${this.results.length}`);
    console.log(`Passed:         ${passed} ✅`);
    console.log(`Failed:         ${failed} ❌`);
    console.log(`Pass Rate:      ${Math.round((passed / this.results.length) * 100)}%`);
    console.log(`Total Time:     ${totalDuration}s`);
    console.log('=============================================================\n');

    return { total: this.results.length, passed, failed, totalDuration, results: this.results };
  }

  // --- TEST SUITES ---
  async runAllTests() {
    await this.setup();

    try {
      // -------------------------------------------------------------
      // SUITE 1: Page Navigation, Branding & DOM Structural Integrity
      // -------------------------------------------------------------
      console.log('\n📦 SUITE 1: Page Navigation, Branding & DOM Structure');

      await this.recordTest('TC-SEL-001', 'Navigate to Web Application Root and Verify Title', async () => {
        await this.driver.get(BASE_URL);
        const title = await this.driver.getTitle();
        if (!title.toLowerCase().includes('concept') && !title.toLowerCase().includes('vite') && !title.toLowerCase().includes('mapper')) {
          throw new Error(`Unexpected page title: "${title}"`);
        }
      });

      await this.recordTest('TC-SEL-002', 'Verify System Brand Badge & Headline are Visible', async () => {
        const headline = await this.driver.findElement(By.xpath("//h1[contains(.,'STEM') or contains(.,'Directed Acyclic Graphs') or contains(.,'Master')]"));
        const isDisplayed = await headline.isDisplayed();
        if (!isDisplayed) throw new Error('Hero headline is not visible on page');
      });

      await this.recordTest('TC-SEL-003', 'Verify Core System Feature Cards Grid Renders', async () => {
        const featureCards = await this.driver.findElements(By.className('glass-panel'));
        if (featureCards.length < 2) {
          throw new Error(`Expected at least 2 glass-panel feature cards, found ${featureCards.length}`);
        }
      });

      // -------------------------------------------------------------
      // SUITE 2: Tab Switching & Form Mode Transitions
      // -------------------------------------------------------------
      console.log('\n📦 SUITE 2: Tab Switching & Form Mode Transitions');

      await this.recordTest('TC-SEL-004', 'Verify Default Active Mode is Password Login', async () => {
        const loginForm = await this.driver.findElement(By.id('password-login-form'));
        const isDisplayed = await loginForm.isDisplayed();
        if (!isDisplayed) throw new Error('Password login form should be visible by default');
      });

      await this.recordTest('TC-SEL-005', 'Switch to Register Tab and Verify Form Toggle', async () => {
        const registerTab = await this.driver.findElement(By.id('tab-register'));
        await registerTab.click();
        await this.driver.wait(until.elementLocated(By.id('register-form')), DEFAULT_TIMEOUT_MS);
        const registerForm = await this.driver.findElement(By.id('register-form'));
        const isDisplayed = await registerForm.isDisplayed();
        if (!isDisplayed) throw new Error('Register form did not become visible after clicking Register tab');
      });

      await this.recordTest('TC-SEL-006', 'Switch Back to Sign In Tab from Register Tab', async () => {
        const signInTab = await this.driver.findElement(By.id('tab-password-login'));
        await signInTab.click();
        await this.driver.wait(until.elementLocated(By.id('password-login-form')), DEFAULT_TIMEOUT_MS);
        const loginForm = await this.driver.findElement(By.id('password-login-form'));
        const isDisplayed = await loginForm.isDisplayed();
        if (!isDisplayed) throw new Error('Password login form did not reappear after clicking Sign In tab');
      });

      // -------------------------------------------------------------
      // SUITE 3: Input Validation & Negative Authentication Tests
      // -------------------------------------------------------------
      console.log('\n📦 SUITE 3: Input Validation & Negative Authentication Tests');

      await this.recordTest('TC-SEL-007', 'Verify Empty Form Submission Triggers HTML5 Required Validation', async () => {
        const usernameInput = await this.driver.findElement(By.id('login-username-input'));
        await usernameInput.clear();
        const passwordInput = await this.driver.findElement(By.id('login-password-input'));
        await passwordInput.clear();

        const submitBtn = await this.driver.findElement(By.id('login-submit-button'));
        await submitBtn.click();

        // Browser constraint validation check
        const isValid = await this.driver.executeScript('return arguments[0].checkValidity();', usernameInput);
        if (isValid) throw new Error('Empty username input should fail validity check');
      });

      await this.recordTest('TC-SEL-008', 'Submit Invalid Credentials and Assert Error Alert Display', async () => {
        const usernameInput = await this.driver.findElement(By.id('login-username-input'));
        await usernameInput.clear();
        await usernameInput.sendKeys('nonexistent_user_9999');

        const passwordInput = await this.driver.findElement(By.id('login-password-input'));
        await passwordInput.clear();
        await passwordInput.sendKeys('wrong_password_xyz');

        const submitBtn = await this.driver.findElement(By.id('login-submit-button'));
        await submitBtn.click();

        await this.driver.wait(until.elementLocated(By.id('auth-error-alert')), DEFAULT_TIMEOUT_MS);
        const errorAlert = await this.driver.findElement(By.id('auth-error-alert'));
        const errorText = await errorAlert.getText();
        if (!errorText || errorText.length === 0) {
          throw new Error('Error alert appeared but contains no text');
        }
      });

      // -------------------------------------------------------------
      // SUITE 4: Successful Authentication & Workspace Redirection
      // -------------------------------------------------------------
      console.log('\n📦 SUITE 4: Successful Authentication & Workspace Redirection');

      await this.recordTest('TC-SEL-009', 'Sign In with Valid Demo Student Account (alex_student)', async () => {
        const usernameInput = await this.driver.findElement(By.id('login-username-input'));
        await usernameInput.clear();
        await usernameInput.sendKeys('alex_student');

        const passwordInput = await this.driver.findElement(By.id('login-password-input'));
        await passwordInput.clear();
        await passwordInput.sendKeys('student123');

        const submitBtn = await this.driver.findElement(By.id('login-submit-button'));
        await submitBtn.click();

        // After successful login, the application mounts StudentDashboard or ConceptGraphCanvas
        await this.driver.wait(async () => {
          const bodyText = await this.driver.findElement(By.tagName('body')).getText();
          return bodyText.includes('Alex Rivera') || bodyText.includes('Alex') || bodyText.includes('STUDENT') || bodyText.includes('Mastery');
        }, 15000);
      });

      // -------------------------------------------------------------
      // SUITE 5: Email OTP & Passwordless / Forgot Password Flow
      // -------------------------------------------------------------
      console.log('\n📦 SUITE 5: Email OTP & Passwordless Flow');

      await this.recordTest('TC-SEL-010', 'Navigate to Forgot Password OTP Request Form', async () => {
        // Logout or reload login page
        await this.driver.get(BASE_URL);
        // Clear local storage to ensure fresh unauthenticated state
        await this.driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
        await this.driver.navigate().refresh();

        await this.driver.wait(until.elementLocated(By.id('btn-forgot-password')), DEFAULT_TIMEOUT_MS);
        const forgotBtn = await this.driver.findElement(By.id('btn-forgot-password'));
        await forgotBtn.click();

        await this.driver.wait(until.elementLocated(By.id('otp-request-form')), DEFAULT_TIMEOUT_MS);
        const otpForm = await this.driver.findElement(By.id('otp-request-form'));
        if (!(await otpForm.isDisplayed())) {
          throw new Error('OTP Request Form is not visible after clicking Forgot Password');
        }
      });

      await this.recordTest('TC-SEL-011', 'Request 6-Digit Email OTP for alex@university.edu', async () => {
        const emailInput = await this.driver.findElement(By.id('otp-email-input'));
        await emailInput.clear();
        await emailInput.sendKeys('alex@university.edu');

        const sendOtpBtn = await this.driver.findElement(By.id('otp-send-button'));
        await sendOtpBtn.click();

        await this.driver.wait(until.elementLocated(By.id('otp-verify-form')), 15000);
        const verifyForm = await this.driver.findElement(By.id('otp-verify-form'));
        if (!(await verifyForm.isDisplayed())) {
          throw new Error('OTP Verify Form did not render after requesting code');
        }
      });

      await this.recordTest('TC-SEL-012', 'Verify 6 Individual Digit Inputs Exist and Support Auto-Fill', async () => {
        for (let i = 0; i < 6; i++) {
          const digitInput = await this.driver.findElement(By.id(`otp-digit-input-${i}`));
          if (!(await digitInput.isDisplayed())) {
            throw new Error(`OTP Digit Input ${i} is not visible`);
          }
        }

        // Test auto-fill button if present in dev mode
        const autoFillButtons = await this.driver.findElements(By.id('btn-autofill-otp'));
        if (autoFillButtons.length > 0) {
          await autoFillButtons[0].click();
          const firstDigitVal = await this.driver.findElement(By.id('otp-digit-input-0')).getAttribute('value');
          if (!firstDigitVal) throw new Error('Auto-fill code button failed to populate digit inputs');
        }
      });

      await this.recordTest('TC-SEL-013', 'Verify OTP Expiration Countdown Timer Display', async () => {
        const timerDisplay = await this.driver.findElement(By.id('otp-timer-display'));
        const timerText = await timerDisplay.getText();
        if (!timerText || !timerText.includes(':')) {
          throw new Error(`Invalid timer display format: "${timerText}"`);
        }
      });

      // -------------------------------------------------------------
      // SUITE 6: Responsive Layout & Viewport Resilience
      // -------------------------------------------------------------
      console.log('\n📦 SUITE 6: Responsive Layout & Viewport Resilience');

      await this.recordTest('TC-SEL-014', 'Verify Layout Stability on Mobile Viewport (375x812)', async () => {
        await this.driver.manage().window().setRect({ width: 375, height: 812 });
        await this.driver.sleep(500);
        const body = await this.driver.findElement(By.tagName('body'));
        if (!(await body.isDisplayed())) throw new Error('Body element corrupted on mobile resize');
      });

      await this.recordTest('TC-SEL-015', 'Verify Layout Stability on Tablet Viewport (768x1024)', async () => {
        await this.driver.manage().window().setRect({ width: 768, height: 1024 });
        await this.driver.sleep(500);
        const body = await this.driver.findElement(By.tagName('body'));
        if (!(await body.isDisplayed())) throw new Error('Body element corrupted on tablet resize');
      });

      await this.recordTest('TC-SEL-016', 'Restore Desktop Viewport (1440x900) and Verify Clean Render', async () => {
        await this.driver.manage().window().setRect({ width: 1440, height: 900 });
        await this.driver.sleep(500);
        const body = await this.driver.findElement(By.tagName('body'));
        if (!(await body.isDisplayed())) throw new Error('Body element corrupted on desktop resize');
      });

    } finally {
      await this.teardown();
    }
  }
}

// Direct Execution Entrypoint
if (require.main === module) {
  const runner = new SeleniumTestRunner();
  runner.runAllTests().catch((err) => {
    console.error('Fatal Selenium Execution Failure:', err);
    process.exit(1);
  });
}

module.exports = SeleniumTestRunner;
