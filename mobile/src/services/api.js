import axios from 'axios';
import { Platform } from 'react-native';
import StorageService from './storage';

// Default host based on platform
// Physical Android device over ADB reverse uses 127.0.0.1, Web/iOS uses localhost
const DEFAULT_HOST = Platform.OS === 'android' ? '127.0.0.1' : 'localhost';
let currentBaseUrl = `http://${DEFAULT_HOST}:8000/api`;

const api = axios.create({
  baseURL: currentBaseUrl,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token if stored
api.interceptors.request.use(async (config) => {
  try {
    const token = await StorageService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Response interceptor: auto-retry with fallback LAN IP if network error occurs on Android
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      Platform.OS === 'android' &&
      originalRequest &&
      !originalRequest._retry &&
      (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'))
    ) {
      originalRequest._retry = true;
      const current = currentBaseUrl;
      const fallback = current.includes('127.0.0.1')
        ? 'http://10.52.246.21:8000/api'
        : 'http://127.0.0.1:8000/api';
      setApiBaseUrl(fallback);
      originalRequest.baseURL = fallback;
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);

// Configure or retrieve current base URL dynamically
export const setApiBaseUrl = (url) => {
  if (url) {
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
    currentBaseUrl = clean;
    api.defaults.baseURL = currentBaseUrl;
    StorageService.setCustomApiUrl(clean);
  }
};

export const getApiBaseUrl = () => currentBaseUrl;

export const initApiConfig = async () => {
  if (Platform.OS === 'android') {
    // 1. Prioritize active USB ADB reverse on 127.0.0.1
    try {
      const res = await axios.get('http://127.0.0.1:8000/', { timeout: 1500 });
      if (res.data?.status === 'Operational') {
        setApiBaseUrl('http://127.0.0.1:8000/api');
        return currentBaseUrl;
      }
    } catch (e) {
      // not on 127.0.0.1 adb reverse
    }

    // 2. Check if user configured a custom URL that is actually reachable
    const custom = await StorageService.getCustomApiUrl();
    if (custom && !custom.includes('10.0.2.2')) {
      try {
        const probeTarget = custom.replace(/\/api\/?$/, '');
        const res = await axios.get(probeTarget, { timeout: 1500 });
        if (res.data?.status === 'Operational') {
          setApiBaseUrl(custom);
          return currentBaseUrl;
        }
      } catch (e) {
        // custom unreachable
      }
    }

    // 2. Check if localhost is reachable
    try {
      const res = await axios.get('http://localhost:8000/', { timeout: 1500 });
      if (res.data?.status === 'Operational') {
        setApiBaseUrl('http://localhost:8000/api');
        return currentBaseUrl;
      }
    } catch (e) {
      // not on localhost
    }

    // 3. Check if LAN IP is reachable (Wi-Fi connection)
    try {
      const res = await axios.get('http://10.52.246.21:8000/', { timeout: 1500 });
      if (res.data?.status === 'Operational') {
        setApiBaseUrl('http://10.52.246.21:8000/api');
        return currentBaseUrl;
      }
    } catch (e) {
      // not on current LAN IP
    }

    // 4. Fallback to 127.0.0.1 (USB) or 10.0.2.2 (Emulator)
    setApiBaseUrl('http://127.0.0.1:8000/api');
  }

  return currentBaseUrl;
};

// Health & Connection Test
export const testBackendConnection = async (testUrl = null) => {
  const target = testUrl ? (testUrl.endsWith('/api') ? testUrl.replace('/api', '') : testUrl) : currentBaseUrl.replace('/api', '');
  const start = Date.now();
  try {
    const res = await axios.get(target, { timeout: 4000 });
    const latency = Date.now() - start;
    return {
      success: true,
      data: res.data,
      latency,
      url: target
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      url: target
    };
  }
};

// --- AUTHENTICATION & USERS ---
export const loginMobileUser = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  if (res.data?.token) {
    await StorageService.setToken(res.data.token);
  }
  if (res.data?.user) {
    await StorageService.setUser(res.data.user);
  }
  return res.data;
};

export const registerMobileUser = async (userData) => {
  const res = await api.post('/auth/register', userData);
  if (res.data?.token) {
    await StorageService.setToken(res.data.token);
  }
  if (res.data?.user) {
    await StorageService.setUser(res.data.user);
  }
  return res.data;
};

export const sendMobileEmailOTP = async (emailData) => {
  const res = await api.post('/auth/send-otp', emailData);
  return res.data;
};

export const verifyMobileEmailOTP = async (verifyData) => {
  const res = await api.post('/auth/verify-otp', verifyData);
  if (res.data?.token) {
    await StorageService.setToken(res.data.token);
  }
  if (res.data?.user) {
    await StorageService.setUser(res.data.user);
  }
  return res.data;
};

export const getMobileUserStats = async (userId, courseId = 1) => {
  try {
    const res = await api.get(`/auth/me?user_id=${userId}&course_id=${courseId}`);
    return res.data;
  } catch (err) {
    console.warn('Failed to fetch mobile user stats', err);
    return null;
  }
};

export const getMobileUsersList = async () => {
  try {
    const res = await api.get('/auth/users');
    return res.data || [];
  } catch (err) {
    console.warn('Failed to fetch mobile users list', err);
    return [];
  }
};

export const resetMobileProgress = async (userId, courseId = 1) => {
  try {
    const res = await api.post('/auth/reset-progress', { user_id: userId, course_id: courseId });
    return res.data;
  } catch (err) {
    console.warn('Failed to reset mobile progress', err);
    return null;
  }
};

// --- COURSES & CURRICULUM ---
export const getMobileCourses = async () => {
  try {
    const res = await api.get('/courses');
    return res.data || [];
  } catch (err) {
    console.warn('Mobile API get courses error', err);
    return [];
  }
};

export const getMobileCourseDetails = async (courseId) => {
  try {
    const res = await api.get(`/courses/${courseId}`);
    return res.data;
  } catch (err) {
    return null;
  }
};

export const createMobileCourse = async (courseData) => {
  const res = await api.post('/courses', courseData);
  return res.data;
};

export const generateMobileAICurriculum = async (topic, category = 'Computer Science', userId = 1) => {
  const res = await api.post('/courses/generate-with-ai', { topic, category, user_id: userId }, { timeout: 60000 });
  return res.data;
};

// --- CONCEPTS, GRAPH & DEEP BRIEFING ---
export const getMobileConceptGraph = async (courseId = 1, userId = 1) => {
  try {
    const res = await api.get(`/concepts/graph/${courseId}?user_id=${userId}`);
    return res.data;
  } catch (err) {
    console.warn('Mobile API concept graph error', err);
    return null;
  }
};

export const getMobileConceptDetails = async (conceptId, userId = 1) => {
  try {
    const res = await api.get(`/concepts/${conceptId}?user_id=${userId}`);
    return res.data;
  } catch (err) {
    console.warn('Mobile API concept details error', err);
    return null;
  }
};

export const getMobileConceptDeepBriefing = async (conceptId) => {
  try {
    const res = await api.get(`/concepts/${conceptId}/deep-briefing`);
    return res.data;
  } catch (err) {
    console.warn('Mobile API deep briefing error', err);
    return null;
  }
};

export const searchMobileGoogleMatter = async (query, conceptId = null) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (conceptId) params.append('concept_id', conceptId);
    const res = await api.get(`/concepts/matter/search?${params.toString()}`);
    return res.data;
  } catch (err) {
    console.warn('Mobile API google matter search error', err);
    return null;
  }
};

// --- ADAPTIVE LEARNING PATHWAY ---
export const getMobileAdaptiveLearningPath = async (targetConceptId, userId = 1) => {
  try {
    const res = await api.get(`/learning-paths/generate?target_concept_id=${targetConceptId}&user_id=${userId}`);
    return res.data;
  } catch (err) {
    console.warn('Mobile API adaptive path error', err);
    return null;
  }
};

// --- QUIZZES & ASSESSMENTS ---
export const getMobileQuiz = async (conceptId) => {
  try {
    const res = await api.get(`/quiz/concept/${conceptId}`);
    return res.data;
  } catch (err) {
    console.warn('Mobile API quiz fetch error', err);
    return null;
  }
};

export const submitMobileQuiz = async (payload) => {
  try {
    const res = await api.post('/quiz/submit', payload);
    return res.data;
  } catch (err) {
    console.warn('Mobile API quiz submit error', err);
    return null;
  }
};

// --- AI TUTOR ASSISTANT ---
export const askMobileAITutor = async (query, conceptId = null, userId = 1) => {
  try {
    const res = await api.post('/ai-tutor/query', {
      user_id: userId,
      concept_id: conceptId,
      query: query
    });
    return res.data;
  } catch (err) {
    return {
      response: "AI Concept Mapper: Prerequisite knowledge graphs systematically reduce learning friction by diagnosing missing foundational skills before you attempt advanced topics!",
      related_prerequisites: ["Calculus", "Linear Algebra"],
      recommended_action: "Review prerequisite graph"
    };
  }
};

// --- COMPARATIVE STUDY ANALYTICS ---
export const getMobileAnalytics = async () => {
  try {
    const res = await api.get('/analytics/comparative-study');
    return res.data;
  } catch (err) {
    console.warn('Mobile API analytics error', err);
    return null;
  }
};

export default api;
