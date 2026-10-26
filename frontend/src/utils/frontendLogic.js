/**
 * Concept Dependency Mapper - Comprehensive Web Frontend Logic Utilities
 * File: frontend/src/utils/frontendLogic.js
 * 
 * Contains pure frontend business logic, validation rules, state management helpers,
 * data transformation algorithms, graph coordinate geometry, sorting, filtering,
 * pagination, error mapping, and formatting functions.
 */

// =============================================================================
// 1. FORM VALIDATION LOGIC
// =============================================================================

/**
 * Validates email according to RFC 5322 regex standards
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return { isValid: false, error: 'Email is required' };
  const trimmed = email.trim();
  if (trimmed.length > 254) return { isValid: false, error: 'Email exceeds maximum length of 254 characters' };
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!regex.test(trimmed)) return { isValid: false, error: 'Invalid email address format' };
  return { isValid: true, error: null, sanitized: trimmed.toLowerCase() };
}

/**
 * Validates password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special)
 */
function validatePassword(password, options = {}) {
  const minLength = options.minLength || 8;
  const maxLength = options.maxLength || 128;
  if (!password || typeof password !== 'string') return { isValid: false, error: 'Password is required' };
  if (password.length < minLength) return { isValid: false, error: `Password must be at least ${minLength} characters long` };
  if (password.length > maxLength) return { isValid: false, error: `Password cannot exceed ${maxLength} characters` };
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const missing = [];
  if (!hasUpper) missing.push('uppercase letter');
  if (!hasLower) missing.push('lowercase letter');
  if (!hasDigit) missing.push('digit');
  if (!hasSpecial) missing.push('special character');

  if (missing.length > 0 && options.strict) {
    return { isValid: false, error: `Password missing: ${missing.join(', ')}`, missing };
  }

  // Calculate entropy score (0 - 100)
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (hasUpper && hasLower) score += 20;
  if (hasDigit) score += 20;
  if (hasSpecial) score += 20;

  return { isValid: true, error: null, score, strength: score >= 80 ? 'STRONG' : (score >= 50 ? 'MEDIUM' : 'WEAK') };
}

/**
 * Validates full name format
 */
function validateFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') return { isValid: false, error: 'Full name is required' };
  const trimmed = fullName.trim();
  if (trimmed.length < 2) return { isValid: false, error: 'Full name must contain at least 2 characters' };
  if (trimmed.length > 70) return { isValid: false, error: 'Full name cannot exceed 70 characters' };
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return { isValid: false, error: 'Full name contains invalid characters' };
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return { isValid: false, error: 'Please enter both first and last name' };
  return { isValid: true, error: null, sanitized: trimmed };
}

/**
 * Validates E.164 and international phone number formats
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return { isValid: false, error: 'Phone number is required' };
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (!/^\+?[0-9]{7,15}$/.test(cleaned)) return { isValid: false, error: 'Invalid telephone number format' };
  return { isValid: true, error: null, sanitized: cleaned };
}

/**
 * Validates ISO 8601 or YYYY-MM-DD date strings
 */
function validateDate(dateStr, minDate = null, maxDate = null) {
  if (!dateStr || typeof dateStr !== 'string') return { isValid: false, error: 'Date is required' };
  const timestamp = Date.parse(dateStr);
  if (isNaN(timestamp)) return { isValid: false, error: 'Invalid date format' };
  const parsedDate = new Date(timestamp);
  if (minDate && parsedDate < new Date(minDate)) return { isValid: false, error: 'Date is before minimum allowed date' };
  if (maxDate && parsedDate > new Date(maxDate)) return { isValid: false, error: 'Date is after maximum allowed date' };
  return { isValid: true, error: null, parsedDate };
}

/**
 * Validates 6-digit numerical OTP code
 */
function validateOTP(otp) {
  if (!otp || typeof otp !== 'string') return { isValid: false, error: 'OTP code is required' };
  const trimmed = otp.trim();
  if (!/^[0-9]{6}$/.test(trimmed)) return { isValid: false, error: 'OTP code must be exactly 6 digits' };
  return { isValid: true, error: null, sanitized: trimmed };
}

/**
 * Validates complete Login form payload
 */
function validateLoginForm(formData) {
  if (!formData || typeof formData !== 'object') return { isValid: false, errors: { form: 'Form data is missing' } };
  const errors = {};
  if (!formData.username || !formData.username.trim()) errors.username = 'Username or email is required';
  if (!formData.password) errors.password = 'Password is required';
  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates complete Signup form payload
 */
function validateSignupForm(formData) {
  if (!formData || typeof formData !== 'object') return { isValid: false, errors: { form: 'Form data is missing' } };
  const errors = {};
  if (!formData.username || formData.username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
  const emailRes = validateEmail(formData.email);
  if (!emailRes.isValid) errors.email = emailRes.error;
  const pwdRes = validatePassword(formData.password, { strict: true });
  if (!pwdRes.isValid) errors.password = pwdRes.error;
  if (formData.confirmPassword !== formData.password) errors.confirmPassword = 'Passwords do not match';
  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates academic report generation request
 */
function validateReportForm(reportData) {
  if (!reportData || typeof reportData !== 'object') return { isValid: false, errors: { form: 'Missing data' } };
  const errors = {};
  if (!reportData.courseId) errors.courseId = 'Target course must be selected';
  if (!reportData.reportType || !['MASTERY', 'ATTENDANCE', 'COHORT_SUMMARY'].includes(reportData.reportType)) {
    errors.reportType = 'Invalid report type selected';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

// =============================================================================
// 2. STATE MANAGEMENT & AUTHENTICATION STATE LOGIC
// =============================================================================

const INITIAL_AUTH_STATE = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null
};

/**
 * Pure state reducer for authentication workflow
 */
function authReducer(state = INITIAL_AUTH_STATE, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, isLoading: false, isAuthenticated: true, user: action.payload.user, token: action.payload.token, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, isAuthenticated: false, user: null, token: null, error: action.payload.error };
    case 'LOGOUT':
      return { ...INITIAL_AUTH_STATE };
    case 'UPDATE_PROFILE':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_TOKEN':
      return { ...state, token: action.payload, isAuthenticated: Boolean(action.payload) };
    default:
      return state;
  }
}

/**
 * Route protection and role-based permission verification
 */
function checkRoutePermission(userRole, requiredRoles = []) {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRole) return false;
  const normalizedUserRole = userRole.toLowerCase();
  const normalizedRequired = requiredRoles.map(r => r.toLowerCase());
  if (normalizedRequired.includes('all') || normalizedRequired.includes('public')) return true;
  if (normalizedUserRole === 'admin') return true; // Superuser bypass
  return normalizedRequired.includes(normalizedUserRole);
}

/**
 * Token expiration check given issue timestamp and TTL seconds
 */
function isTokenExpired(issuedAtMs, ttlSeconds = 86400, currentMs = Date.now()) {
  if (!issuedAtMs) return true;
  const expiryMs = issuedAtMs + (ttlSeconds * 1000);
  return currentMs >= expiryMs;
}

// =============================================================================
// 3. GRAPH GEOMETRY & DATA TRANSFORMATION
// =============================================================================

/**
 * Calculates 2D Euclidean distance between two graph node coordinates
 */
function calculateEuclideanDistance(pointA, pointB) {
  if (!pointA || !pointB) return 0;
  const dx = (pointB.x || 0) - (pointA.x || 0);
  const dy = (pointB.y || 0) - (pointA.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates Manhattan distance between two graph node coordinates
 */
function calculateManhattanDistance(pointA, pointB) {
  if (!pointA || !pointB) return 0;
  return Math.abs((pointB.x || 0) - (pointA.x || 0)) + Math.abs((pointB.y || 0) - (pointA.y || 0));
}

/**
 * Transforms raw database concept nodes into positioned DAG canvas nodes
 */
function transformGraphData(rawNodes = [], rawEdges = [], canvasWidth = 1200) {
  const nodeMap = new Map();
  const transformedNodes = rawNodes.map((n, index) => {
    const nodeObj = {
      id: String(n.id),
      label: n.name || n.title || 'Unnamed Concept',
      description: n.description || '',
      difficulty: n.difficulty_level || n.difficulty || 'Intermediate',
      mastery: Number(n.mastery_score || n.mastery || 0),
      x: n.x !== undefined ? n.x : (100 + (index % 4) * 280),
      y: n.y !== undefined ? n.y : (120 + Math.floor(index / 4) * 180),
      prerequisites: []
    };
    nodeMap.set(nodeObj.id, nodeObj);
    return nodeObj;
  });

  const transformedEdges = rawEdges.map((e, index) => {
    const sourceId = String(e.source || e.prerequisite_id);
    const targetId = String(e.target || e.concept_id);
    if (nodeMap.has(targetId)) {
      nodeMap.get(targetId).prerequisites.push(sourceId);
    }
    return {
      id: `edge-${index}-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      weight: Number(e.weight || 1.0)
    };
  });

  return { nodes: transformedNodes, edges: transformedEdges };
}

/**
 * Calculates topological order of DAG nodes (Kahn's Algorithm)
 */
function calculateTopologicalSort(nodes = [], edges = []) {
  const inDegree = new Map();
  const adj = new Map();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach(e => {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
    if (inDegree.has(e.target)) inDegree.set(e.target, inDegree.get(e.target) + 1);
  });

  const queue = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const order = [];
  while (queue.length > 0) {
    const u = queue.shift();
    order.push(u);
    if (adj.has(u)) {
      adj.get(u).forEach(v => {
        inDegree.set(v, inDegree.get(v) - 1);
        if (inDegree.get(v) === 0) queue.push(v);
      });
    }
  }

  const hasCycle = order.length !== nodes.length;
  return { order, hasCycle, totalProcessed: order.length };
}

/**
 * Calculates student mastery score percentage from correct questions
 */
function calculateMasteryPercentage(correctCount, totalCount) {
  if (!totalCount || totalCount <= 0) return 0;
  if (!correctCount || correctCount < 0) return 0;
  const pct = Math.round((Math.min(correctCount, totalCount) / totalCount) * 100);
  return Math.min(Math.max(pct, 0), 100);
}

// =============================================================================
// 4. SEARCH, FILTER, SORT & PAGINATION LOGIC
// =============================================================================

/**
 * Searches concepts by query string across name, title, and description
 */
function searchConcepts(concepts = [], query = '') {
  if (!query || !query.trim()) return [...concepts];
  const q = query.trim().toLowerCase();
  return concepts.filter(c => {
    const nameMatch = (c.name || c.title || '').toLowerCase().includes(q);
    const descMatch = (c.description || '').toLowerCase().includes(q);
    const codeMatch = (c.code || '').toLowerCase().includes(q);
    return nameMatch || descMatch || codeMatch;
  });
}

/**
 * Filters concept items by category, difficulty, and mastery criteria
 */
function filterConcepts(concepts = [], criteria = {}) {
  return concepts.filter(c => {
    if (criteria.category && criteria.category !== 'All') {
      if ((c.category || '').toLowerCase() !== criteria.category.toLowerCase()) return false;
    }
    if (criteria.difficulty && criteria.difficulty !== 'All') {
      if ((c.difficulty || c.difficulty_level || '').toLowerCase() !== criteria.difficulty.toLowerCase()) return false;
    }
    if (criteria.minMastery !== undefined) {
      if ((c.mastery || 0) < criteria.minMastery) return false;
    }
    if (criteria.maxMastery !== undefined) {
      if ((c.mastery || 0) > criteria.maxMastery) return false;
    }
    return true;
  });
}

/**
 * Pure sorting function for concept objects
 */
function sortConcepts(concepts = [], sortKey = 'name', ascending = true) {
  return [...concepts].sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];
    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (typeof valA === 'string' && typeof valB === 'string') {
      const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      return ascending ? cmp : -cmp;
    }
    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });
}

/**
 * Pure pagination slice calculation
 */
function paginate(items = [], page = 1, pageSize = 10) {
  const safePageSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);

  const startIndex = (currentPage - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, totalItems);
  const pageItems = items.slice(startIndex, endIndex);

  return {
    items: pageItems,
    currentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}

// =============================================================================
// 5. FORMATTING & NOTIFICATION LOGIC
// =============================================================================

/**
 * Formats ISO date string into standard human-readable display
 */
function formatDateTime(isoString, formatType = 'SHORT') {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  switch (formatType) {
    case 'DATE_ONLY':
      return `${year}-${month}-${day}`;
    case 'TIME_ONLY':
      return `${hours}:${minutes}`;
    case 'LONG':
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'SHORT':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

/**
 * Formats duration in minutes to human-readable string (e.g. 2h 15m)
 */
function formatDuration(minutes) {
  if (minutes === undefined || minutes === null || isNaN(minutes) || minutes < 0) return '0m';
  const m = Math.floor(minutes);
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  if (hrs === 0) return `${rem}m`;
  if (rem === 0) return `${hrs}h`;
  return `${hrs}h ${rem}m`;
}

/**
 * Manages notification queue (push, pop, dismiss, clear)
 */
function notificationQueueManager(queue = [], action = {}) {
  switch (action.type) {
    case 'ENQUEUE':
      const newNotification = {
        id: action.payload.id || `notif-${Date.now()}-${Math.random()}`,
        message: action.payload.message || '',
        type: action.payload.type || 'INFO', // INFO, SUCCESS, WARNING, ERROR
        timestamp: Date.now()
      };
      return [...queue, newNotification];
    case 'DISMISS':
      return queue.filter(item => item.id !== action.payload.id);
    case 'CLEAR':
      return [];
    default:
      return queue;
  }
}

// =============================================================================
// 6. API RESPONSE & ERROR HANDLING LOGIC
// =============================================================================

/**
 * Parses and normalizes backend API response objects
 */
function handleApiResponse(response) {
  if (!response) return { isSuccess: false, data: null, message: 'Empty response' };
  const status = response.status || 200;
  if (status >= 200 && status < 300) {
    return {
      isSuccess: true,
      data: response.data || response,
      message: response.data?.message || 'Operation successful'
    };
  }
  return {
    isSuccess: false,
    data: null,
    message: response.data?.detail || response.data?.message || 'API operation failed'
  };
}

/**
 * Maps HTTP error codes and exception messages to user-facing strings
 */
function mapApiError(error) {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;

  const status = error.response?.status || error.status;
  const detail = error.response?.data?.detail || error.message;

  switch (status) {
    case 400:
      return detail || 'Invalid request. Please verify your inputs.';
    case 401:
      return 'Session expired or unauthenticated. Please sign in again.';
    case 403:
      return 'Access forbidden. You do not possess the required permissions.';
    case 404:
      return 'The requested resource or concept could not be found.';
    case 413:
      return 'Uploaded payload exceeds maximum allowable size.';
    case 422:
      return 'Input validation failed. Please check field formats.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    case 500:
    case 502:
    case 503:
      return 'Server error encountered. Our academic infrastructure is temporarily busy.';
    default:
      return detail || 'Network connectivity error. Please check your connection.';
  }
}

// Export for ES Modules and modern JavaScript
export {
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
};
