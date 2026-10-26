import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token if available in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('concept_mapper_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Authentication & User Endpoints ---
export const loginUser = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  if (res.data?.token) {
    localStorage.setItem('concept_mapper_auth_token', res.data.token);
    localStorage.setItem('concept_mapper_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const sendEmailOTP = async (emailData) => {
  const res = await api.post('/auth/send-otp', emailData);
  return res.data;
};

export const verifyEmailOTP = async (verifyData) => {
  const res = await api.post('/auth/verify-otp', verifyData);
  if (res.data?.token) {
    localStorage.setItem('concept_mapper_auth_token', res.data.token);
    localStorage.setItem('concept_mapper_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const registerUser = async (userData) => {
  const res = await api.post('/auth/register', userData);
  if (res.data?.token) {
    localStorage.setItem('concept_mapper_auth_token', res.data.token);
    localStorage.setItem('concept_mapper_user', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const getCurrentUserStats = async (userId, courseId = 1) => {
  try {
    const res = await api.get(`/auth/me?user_id=${userId}&course_id=${courseId}`);
    return res.data;
  } catch (err) {
    console.warn('Failed to fetch user stats', err);
    return null;
  }
};

export const getUsersList = async () => {
  try {
    const res = await api.get('/auth/users');
    return res.data;
  } catch (err) {
    console.warn('Failed to fetch users list', err);
    return [];
  }
};

export const resetUserProgress = async (userId, courseId = 1) => {
  try {
    const res = await api.post('/auth/reset-progress', {
      user_id: userId,
      course_id: courseId
    });
    return res.data;
  } catch (err) {
    console.warn('Failed to reset progress', err);
    return null;
  }
};

// --- Courses Endpoints ---
export const getCourses = async () => {
  try {
    const res = await api.get('/courses');
    return res.data || [];
  } catch (err) {
    console.warn('Backend courses error', err);
    return [];
  }
};

export const createCourse = async (courseData) => {
  const res = await api.post('/courses', courseData);
  return res.data;
};

export const generateAICurriculum = async (topic, category = 'Computer Science', userId = 1) => {
  const res = await api.post('/courses/generate-with-ai', { topic, category, user_id: userId });
  return res.data;
};

// --- Concept Graph & Dependency Endpoints ---
export const getConceptGraph = async (courseId = 1, userId = 1) => {
  try {
    const res = await api.get(`/concepts/graph/${courseId}?user_id=${userId}`);
    return res.data;
  } catch (err) {
    console.warn('Backend error fetching concept graph', err);
    return null;
  }
};

export const createConcept = async (conceptData) => {
  const res = await api.post('/concepts', conceptData);
  return res.data;
};

export const createDependency = async (dependencyData) => {
  const res = await api.post('/concepts/dependencies', dependencyData);
  return res.data;
};

export const getConceptDetails = async (conceptId, userId = 1) => {
  try {
    const res = await api.get(`/concepts/${conceptId}?user_id=${userId}`);
    return res.data;
  } catch (err) {
    console.warn('Backend error for concept details', err);
    return null;
  }
};

export const getConceptDeepBriefing = async (conceptId) => {
  try {
    const res = await api.get(`/concepts/${conceptId}/deep-briefing`);
    return res.data;
  } catch (err) {
    console.warn('Backend error for deep briefing', err);
    return null;
  }
};

export const searchGoogleConceptMatter = async (query, conceptId = null) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (conceptId) params.append('concept_id', conceptId);
    const res = await api.get(`/concepts/matter/search?${params.toString()}`);
    return res.data;
  } catch (err) {
    console.warn('Backend error searching Google concept matter', err);
    return null;
  }
};

export const getAdaptiveLearningPath = async (targetConceptId, userId = 1) => {
  try {
    const res = await api.get(`/learning-paths/generate?target_concept_id=${targetConceptId}&user_id=${userId}`);
    return res.data;
  } catch (err) {
    console.warn('Backend error for adaptive path', err);
    return null;
  }
};

// --- Quiz & Assessment Endpoints ---
export const getQuizForConcept = async (conceptId) => {
  try {
    const res = await api.get(`/quiz/concept/${conceptId}`);
    return res.data;
  } catch (err) {
    console.warn('Backend error fetching quiz', err);
    return null;
  }
};

export const createQuiz = async (quizData) => {
  const res = await api.post('/quiz/create', quizData);
  return res.data;
};

export const submitQuizAttempt = async (quizData) => {
  try {
    const res = await api.post('/quiz/submit', quizData);
    return res.data;
  } catch (err) {
    console.warn('Backend error submitting quiz', err);
    return null;
  }
};

// --- Comparative Analytics Endpoints ---
export const getComparativeAnalytics = async () => {
  try {
    const res = await api.get('/analytics/comparative-study');
    return res.data;
  } catch (err) {
    console.warn('Backend analytics error', err);
    return null;
  }
};

// --- AI Tutor Endpoints ---
export const queryAITutor = async (query, conceptId = null, userId = 1) => {
  try {
    const res = await api.post('/ai-tutor/query', {
      user_id: userId,
      concept_id: conceptId,
      query: query
    });
    return res.data;
  } catch (err) {
    console.warn('Backend error querying AI tutor', err);
    return {
      response: "AI Concept Mapper: Prerequisite knowledge graphs systematically reduce learning friction by diagnosing missing foundational skills before you attempt advanced topics!",
      related_prerequisites: ["Calculus", "Linear Algebra"],
      recommended_action: "Explore Graph"
    };
  }
};

export default api;

