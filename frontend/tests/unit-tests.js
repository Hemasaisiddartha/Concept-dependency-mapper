/**
 * Concept Dependency Mapper - Comprehensive Web Frontend Unit Test Runner
 * File: frontend/tests/unit-tests.js
 * 
 * Executes unit tests for pure frontend logic functions:
 * - Validations (Email, Password, Full Name, Phone, Date, OTP, Login, Signup, Report)
 * - State Management & Auth (Reducers, Route Permissions, Token Expiry, Profile Update, Logout)
 * - Math & Graph Transformations (Euclidean Distance, Manhattan Distance, Topological Kahn Sort, Mastery Pct)
 * - Filtering, Sorting, Searching, and Pagination
 * - Formatting & Notification Queues
 * - API Response & Error Mapping
 */

import {
  validateEmail,
  validatePassword,
  validateFullName,
  validatePhone,
  validateDate,
  validateOTP,
  validateLoginForm,
  validateSignupForm,
  validateReportForm,
  authReducer,
  checkRoutePermission,
  isTokenExpired,
  calculateEuclideanDistance,
  calculateManhattanDistance,
  transformGraphData,
  calculateTopologicalSort,
  calculateMasteryPercentage,
  searchConcepts,
  filterConcepts,
  sortConcepts,
  paginate,
  formatDateTime,
  formatDuration,
  notificationQueueManager,
  handleApiResponse,
  mapApiError
} from '../src/utils/frontendLogic.js';

class FrontendUnitTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message || 'Assertion failed'}: Expected "${expected}", received "${actual}"`);
    }
  }

  assertDeepEqual(actual, expected, message) {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) {
      throw new Error(`${message || 'Deep equality failed'}: Expected ${expStr}, received ${actStr}`);
    }
  }

  recordTest(id, category, name, testFn) {
    const start = Date.now();
    try {
      testFn();
      const duration = Date.now() - start;
      this.results.push({ id, category, name, status: 'PASSED', duration, error: null });
      console.log(`  ✅ [PASS] ${id} - ${name} (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - start;
      this.results.push({ id, category, name, status: 'FAILED', duration, error: err.message });
      console.error(`  ❌ [FAIL] ${id} - ${name} (${duration}ms)`);
      console.error(`     Error: ${err.message}`);
    }
  }

  runAllTests() {
    console.log('\n=============================================================');
    console.log('🧪 RUNNING FRONTEND UNIT TESTING SUITE (LOGICAL BEHAVIORS)');
    console.log('=============================================================\n');

    // -------------------------------------------------------------------------
    // 1. Email Validation Logic
    // -------------------------------------------------------------------------
    console.log('📦 1. Email Validation Logic');
    this.recordTest('TC-UNIT-001', 'Email Validation', 'Accept standard valid email format', () => {
      const res = validateEmail('student@university.edu');
      this.assert(res.isValid, 'Standard email should be valid');
      this.assertEqual(res.sanitized, 'student@university.edu');
    });

    this.recordTest('TC-UNIT-002', 'Email Validation', 'Reject email missing @ symbol', () => {
      const res = validateEmail('studentuniversity.edu');
      this.assert(!res.isValid, 'Missing @ should be invalid');
    });

    this.recordTest('TC-UNIT-003', 'Email Validation', 'Reject email missing top-level domain', () => {
      const res = validateEmail('student@university');
      this.assert(!res.isValid, 'Missing TLD should be invalid');
    });

    this.recordTest('TC-UNIT-004', 'Email Validation', 'Sanitize and lowercase mixed case email', () => {
      const res = validateEmail('ALEX.Rivera@Gmail.COM');
      this.assert(res.isValid);
      this.assertEqual(res.sanitized, 'alex.rivera@gmail.com');
    });

    this.recordTest('TC-UNIT-005', 'Email Validation', 'Reject empty string email', () => {
      const res = validateEmail('');
      this.assert(!res.isValid);
    });

    // -------------------------------------------------------------------------
    // 2. Password Validation Logic
    // -------------------------------------------------------------------------
    console.log('\n📦 2. Password Validation Logic');
    this.recordTest('TC-UNIT-006', 'Password Validation', 'Validate strong password meeting all criteria', () => {
      const res = validatePassword('P@ssword123', { strict: true });
      this.assert(res.isValid);
      this.assertEqual(res.strength, 'STRONG');
    });

    this.recordTest('TC-UNIT-007', 'Password Validation', 'Reject password under 8 characters', () => {
      const res = validatePassword('Abc1!', { minLength: 8 });
      this.assert(!res.isValid);
    });

    this.recordTest('TC-UNIT-008', 'Password Validation', 'Flag missing special character in strict mode', () => {
      const res = validatePassword('Password123', { strict: true });
      this.assert(!res.isValid);
      this.assert(res.missing.includes('special character'));
    });

    this.recordTest('TC-UNIT-009', 'Password Validation', 'Compute entropy score for medium password', () => {
      const res = validatePassword('SimplePass1');
      this.assert(res.isValid);
      this.assert(res.score >= 50);
    });

    // -------------------------------------------------------------------------
    // 3. Full Name & Phone Validation
    // -------------------------------------------------------------------------
    console.log('\n📦 3. Full Name & Phone Validation');
    this.recordTest('TC-UNIT-010', 'Full-Name Validation', 'Accept valid first and last name', () => {
      const res = validateFullName('Alex Rivera');
      this.assert(res.isValid);
      this.assertEqual(res.sanitized, 'Alex Rivera');
    });

    this.recordTest('TC-UNIT-011', 'Full-Name Validation', 'Reject single word name', () => {
      const res = validateFullName('Alex');
      this.assert(!res.isValid);
    });

    this.recordTest('TC-UNIT-012', 'Phone Validation', 'Accept valid E.164 phone number', () => {
      const res = validatePhone('+1 (555) 123-4567');
      this.assert(res.isValid);
      this.assertEqual(res.sanitized, '+15551234567');
    });

    this.recordTest('TC-UNIT-013', 'Phone Validation', 'Reject alphabetical characters in phone', () => {
      const res = validatePhone('555-CALL-NOW');
      this.assert(!res.isValid);
    });

    // -------------------------------------------------------------------------
    // 4. Date & OTP Validation
    // -------------------------------------------------------------------------
    console.log('\n📦 4. Date & OTP Validation');
    this.recordTest('TC-UNIT-014', 'Date Validation', 'Accept valid ISO YYYY-MM-DD date', () => {
      const res = validateDate('2026-10-26');
      this.assert(res.isValid);
    });

    this.recordTest('TC-UNIT-015', 'Date Validation', 'Reject invalid calendar date string', () => {
      const res = validateDate('invalid-date-xyz');
      this.assert(!res.isValid);
    });

    this.recordTest('TC-UNIT-016', 'OTP Validation', 'Accept exactly 6 numerical digits', () => {
      const res = validateOTP('849201');
      this.assert(res.isValid);
      this.assertEqual(res.sanitized, '849201');
    });

    this.recordTest('TC-UNIT-017', 'OTP Validation', 'Reject 5-digit short OTP', () => {
      const res = validateOTP('12345');
      this.assert(!res.isValid);
    });

    this.recordTest('TC-UNIT-018', 'OTP Validation', 'Reject alpha characters in OTP', () => {
      const res = validateOTP('12A456');
      this.assert(!res.isValid);
    });

    // -------------------------------------------------------------------------
    // 5. Complete Form Validation Logic
    // -------------------------------------------------------------------------
    console.log('\n📦 5. Login, Signup & Report Form Validation');
    this.recordTest('TC-UNIT-019', 'Login Form Validation', 'Accept complete login form', () => {
      const res = validateLoginForm({ username: 'alex_student', password: 'student123' });
      this.assert(res.isValid);
    });

    this.recordTest('TC-UNIT-020', 'Login Form Validation', 'Flag missing password field', () => {
      const res = validateLoginForm({ username: 'alex_student', password: '' });
      this.assert(!res.isValid);
      this.assert(res.errors.password);
    });

    this.recordTest('TC-UNIT-021', 'Signup Form Validation', 'Flag password confirmation mismatch', () => {
      const res = validateSignupForm({
        username: 'alex',
        email: 'alex@edu.org',
        password: 'PassWord123!',
        confirmPassword: 'MismatchPassword!'
      });
      this.assert(!res.isValid);
      this.assertEqual(res.errors.confirmPassword, 'Passwords do not match');
    });

    this.recordTest('TC-UNIT-022', 'Report Validation', 'Accept valid cohort summary report request', () => {
      const res = validateReportForm({ courseId: 1, reportType: 'COHORT_SUMMARY' });
      this.assert(res.isValid);
    });

    // -------------------------------------------------------------------------
    // 6. State Management & Auth Reducer
    // -------------------------------------------------------------------------
    console.log('\n📦 6. State Management & Auth Reducer');
    this.recordTest('TC-UNIT-023', 'State Management', 'Handle LOGIN_START action', () => {
      const state = authReducer(undefined, { type: 'LOGIN_START' });
      this.assertEqual(state.isLoading, true);
      this.assertEqual(state.error, null);
    });

    this.recordTest('TC-UNIT-024', 'State Management', 'Handle LOGIN_SUCCESS action', () => {
      const user = { id: 1, username: 'alex_student', role: 'student' };
      const state = authReducer(undefined, {
        type: 'LOGIN_SUCCESS',
        payload: { user, token: 'token_1:alex:abc' }
      });
      this.assertEqual(state.isAuthenticated, true);
      this.assertEqual(state.token, 'token_1:alex:abc');
      this.assertEqual(state.user.username, 'alex_student');
    });

    this.recordTest('TC-UNIT-025', 'State Management', 'Handle LOGOUT action and clear state', () => {
      const activeState = { isAuthenticated: true, user: { id: 1 }, token: 'abc', isLoading: false, error: null };
      const state = authReducer(activeState, { type: 'LOGOUT' });
      this.assertEqual(state.isAuthenticated, false);
      this.assertEqual(state.token, null);
      this.assertEqual(state.user, null);
    });

    this.recordTest('TC-UNIT-026', 'Profile Update', 'Handle UPDATE_PROFILE action immutably', () => {
      const initial = { isAuthenticated: true, user: { id: 1, name: 'Alex' } };
      const state = authReducer(initial, { type: 'UPDATE_PROFILE', payload: { name: 'Alexander Rivera' } });
      this.assertEqual(state.user.name, 'Alexander Rivera');
      this.assertEqual(state.user.id, 1);
    });

    this.recordTest('TC-UNIT-027', 'Route Protection', 'Grant instructor access to instructor role', () => {
      const allowed = checkRoutePermission('instructor', ['instructor', 'admin']);
      this.assertEqual(allowed, true);
    });

    this.recordTest('TC-UNIT-028', 'Route Protection', 'Deny student access to admin-only route', () => {
      const allowed = checkRoutePermission('student', ['admin']);
      this.assertEqual(allowed, false);
    });

    this.recordTest('TC-UNIT-029', 'Route Protection', 'Admin bypasses all role requirements', () => {
      const allowed = checkRoutePermission('admin', ['instructor']);
      this.assertEqual(allowed, true);
    });

    this.recordTest('TC-UNIT-030', 'Token Expiry', 'Flag token as expired when currentMs > expiryMs', () => {
      const issuedAt = 1000000;
      const ttl = 3600; // 1 hour
      const current = 1000000 + (3601 * 1000);
      this.assertEqual(isTokenExpired(issuedAt, ttl, current), true);
    });

    // -------------------------------------------------------------------------
    // 7. Graph Geometry & Distance Calculation
    // -------------------------------------------------------------------------
    console.log('\n📦 7. Graph Distance Calculation & Topological Sort');
    this.recordTest('TC-UNIT-031', 'Distance Calculation', 'Compute 3-4-5 Euclidean right triangle distance', () => {
      const dist = calculateEuclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
      this.assertEqual(dist, 5);
    });

    this.recordTest('TC-UNIT-032', 'Distance Calculation', 'Compute Manhattan grid distance', () => {
      const dist = calculateManhattanDistance({ x: 10, y: 20 }, { x: 15, y: 30 });
      this.assertEqual(dist, 15);
    });

    this.recordTest('TC-UNIT-033', 'Topological Sorting', 'Sort linear 3-node dependency chain (A -> B -> C)', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
      const edges = [{ source: 'A', target: 'B' }, { source: 'B', target: 'C' }];
      const result = calculateTopologicalSort(nodes, edges);
      this.assertEqual(result.hasCycle, false);
      this.assertDeepEqual(result.order, ['A', 'B', 'C']);
    });

    this.recordTest('TC-UNIT-034', 'Topological Sorting', 'Detect cycle in closed loop graph (A -> B -> A)', () => {
      const nodes = [{ id: 'A' }, { id: 'B' }];
      const edges = [{ source: 'A', target: 'B' }, { source: 'B', target: 'A' }];
      const result = calculateTopologicalSort(nodes, edges);
      this.assertEqual(result.hasCycle, true);
    });

    this.recordTest('TC-UNIT-035', 'Mastery Calculation', 'Calculate 80% mastery for 16/20 questions', () => {
      const pct = calculateMasteryPercentage(16, 20);
      this.assertEqual(pct, 80);
    });

    // -------------------------------------------------------------------------
    // 8. Search, Filtering, Sorting & Pagination
    // -------------------------------------------------------------------------
    console.log('\n📦 8. Search, Filter, Sort & Pagination Logic');
    const mockConcepts = [
      { id: 1, name: 'Machine Learning', category: 'CS', difficulty: 'Intermediate', mastery: 85 },
      { id: 2, name: 'Robotics Kinematics', category: 'Robotics', difficulty: 'Advanced', mastery: 40 },
      { id: 3, name: 'Algorithms & Complexity', category: 'CS', difficulty: 'Beginner', mastery: 95 },
      { id: 4, name: 'Quantum Gates', category: 'Physics', difficulty: 'Advanced', mastery: 20 }
    ];

    this.recordTest('TC-UNIT-036', 'Search Logic', 'Filter concepts matching search substring', () => {
      const found = searchConcepts(mockConcepts, 'robot');
      this.assertEqual(found.length, 1);
      this.assertEqual(found[0].name, 'Robotics Kinematics');
    });

    this.recordTest('TC-UNIT-037', 'Filter Logic', 'Filter concepts by category CS and minMastery 80', () => {
      const filtered = filterConcepts(mockConcepts, { category: 'CS', minMastery: 80 });
      this.assertEqual(filtered.length, 2);
    });

    this.recordTest('TC-UNIT-038', 'Sorting Logic', 'Sort concepts by mastery descending', () => {
      const sorted = sortConcepts(mockConcepts, 'mastery', false);
      this.assertEqual(sorted[0].mastery, 95);
      this.assertEqual(sorted[3].mastery, 20);
    });

    this.recordTest('TC-UNIT-039', 'Pagination Logic', 'Paginate 4 items into 2 items per page (page 2)', () => {
      const res = paginate(mockConcepts, 2, 2);
      this.assertEqual(res.items.length, 2);
      this.assertEqual(res.currentPage, 2);
      this.assertEqual(res.totalPages, 2);
      this.assertEqual(res.hasNextPage, false);
      this.assertEqual(res.hasPrevPage, true);
    });

    // -------------------------------------------------------------------------
    // 9. Formatting, Notifications & Error Mapping
    // -------------------------------------------------------------------------
    console.log('\n📦 9. Formatting, Notifications & API Error Handling');
    this.recordTest('TC-UNIT-040', 'Duration Formatting', 'Format 135 minutes to 2h 15m', () => {
      const str = formatDuration(135);
      this.assertEqual(str, '2h 15m');
    });

    this.recordTest('TC-UNIT-041', 'Date Formatting', 'Format ISO string to DATE_ONLY format', () => {
      const str = formatDateTime('2026-10-26T12:00:00Z', 'DATE_ONLY');
      this.assertEqual(str, '2026-10-26');
    });

    this.recordTest('TC-UNIT-042', 'Notification Queue', 'Enqueue notification and dismiss by ID', () => {
      let queue = notificationQueueManager([], { type: 'ENQUEUE', payload: { id: 'msg-1', message: 'Hello' } });
      this.assertEqual(queue.length, 1);
      queue = notificationQueueManager(queue, { type: 'DISMISS', payload: { id: 'msg-1' } });
      this.assertEqual(queue.length, 0);
    });

    this.recordTest('TC-UNIT-043', 'API Response Handling', 'Parse HTTP 200 response with payload', () => {
      const res = handleApiResponse({ status: 200, data: { user: 'alex' } });
      this.assertEqual(res.isSuccess, true);
      this.assertEqual(res.data.user, 'alex');
    });

    this.recordTest('TC-UNIT-044', 'Error Mapping', 'Map HTTP 401 status to re-authentication prompt', () => {
      const msg = mapApiError({ status: 401 });
      this.assert(msg.includes('Session expired'));
    });

    this.recordTest('TC-UNIT-045', 'Error Mapping', 'Map HTTP 429 status to rate-limiting throttling prompt', () => {
      const msg = mapApiError({ status: 429 });
      this.assert(msg.includes('Too many requests'));
    });

    // Execution Summary
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n=============================================================');
    console.log('📊 FRONTEND UNIT TEST EXECUTION SUMMARY');
    console.log('=============================================================');
    console.log(`Total Executed: ${total}`);
    console.log(`Passed:         ${passed} ✅`);
    console.log(`Failed:         ${failed} ❌`);
    console.log(`Pass Rate:      ${Math.round((passed / total) * 100)}%`);
    console.log(`Execution Time: ${elapsed}s`);
    console.log('=============================================================\n');

    return { total, passed, failed, results: this.results };
  }
}

const runner = new FrontendUnitTestRunner();
const summary = runner.runAllTests();
if (summary.failed > 0) {
  process.exit(1);
}

export default FrontendUnitTestRunner;
