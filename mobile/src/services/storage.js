import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: 'concept_mapper_mobile_user',
  TOKEN: 'concept_mapper_mobile_token',
  API_URL: 'concept_mapper_mobile_api_url',
  ACTIVE_COURSE: 'concept_mapper_mobile_active_course'
};

// In-memory fallback in case native storage is unavailable or slow
const memoryStore = new Map();

export const StorageService = {
  async getUser() {
    try {
      if (AsyncStorage && AsyncStorage.getItem) {
        const val = await AsyncStorage.getItem(KEYS.USER);
        if (val) return JSON.parse(val);
      }
    } catch (e) {
      // Fallback to memory
    }
    const mem = memoryStore.get(KEYS.USER);
    return mem ? JSON.parse(mem) : null;
  },

  async setUser(user) {
    try {
      if (user) {
        const str = JSON.stringify(user);
        memoryStore.set(KEYS.USER, str);
        if (AsyncStorage && AsyncStorage.setItem) {
          await AsyncStorage.setItem(KEYS.USER, str);
        }
      } else {
        memoryStore.delete(KEYS.USER);
        if (AsyncStorage && AsyncStorage.removeItem) {
          await AsyncStorage.removeItem(KEYS.USER);
        }
      }
    } catch (e) {
      // Silent fallback to memoryStore
    }
  },

  async getToken() {
    try {
      if (AsyncStorage && AsyncStorage.getItem) {
        const val = await AsyncStorage.getItem(KEYS.TOKEN);
        if (val) return val;
      }
    } catch (e) {
      // Fallback
    }
    return memoryStore.get(KEYS.TOKEN) || null;
  },

  async setToken(token) {
    try {
      if (token) {
        memoryStore.set(KEYS.TOKEN, token);
        if (AsyncStorage && AsyncStorage.setItem) {
          await AsyncStorage.setItem(KEYS.TOKEN, token);
        }
      } else {
        memoryStore.delete(KEYS.TOKEN);
        if (AsyncStorage && AsyncStorage.removeItem) {
          await AsyncStorage.removeItem(KEYS.TOKEN);
        }
      }
    } catch (e) {
      // Silent fallback
    }
  },

  async getCustomApiUrl() {
    try {
      if (AsyncStorage && AsyncStorage.getItem) {
        const val = await AsyncStorage.getItem(KEYS.API_URL);
        if (val) return val;
      }
    } catch (e) {
      // Fallback
    }
    return memoryStore.get(KEYS.API_URL) || null;
  },

  async setCustomApiUrl(url) {
    try {
      if (url) {
        const trimmed = url.trim();
        memoryStore.set(KEYS.API_URL, trimmed);
        if (AsyncStorage && AsyncStorage.setItem) {
          await AsyncStorage.setItem(KEYS.API_URL, trimmed);
        }
      } else {
        memoryStore.delete(KEYS.API_URL);
        if (AsyncStorage && AsyncStorage.removeItem) {
          await AsyncStorage.removeItem(KEYS.API_URL);
        }
      }
    } catch (e) {
      // Silent fallback
    }
  },

  async getActiveCourseId() {
    try {
      if (AsyncStorage && AsyncStorage.getItem) {
        const val = await AsyncStorage.getItem(KEYS.ACTIVE_COURSE);
        if (val) return parseInt(val, 10);
      }
    } catch (e) {
      // Fallback
    }
    const mem = memoryStore.get(KEYS.ACTIVE_COURSE);
    return mem ? parseInt(mem, 10) : null;
  },

  async setActiveCourseId(courseId) {
    try {
      if (courseId) {
        const str = courseId.toString();
        memoryStore.set(KEYS.ACTIVE_COURSE, str);
        if (AsyncStorage && AsyncStorage.setItem) {
          await AsyncStorage.setItem(KEYS.ACTIVE_COURSE, str);
        }
      }
    } catch (e) {
      // Silent fallback
    }
  },

  async clearSession() {
    try {
      memoryStore.delete(KEYS.USER);
      memoryStore.delete(KEYS.TOKEN);
      if (AsyncStorage && AsyncStorage.multiRemove) {
        await AsyncStorage.multiRemove([KEYS.USER, KEYS.TOKEN]);
      }
    } catch (e) {
      // Silent fallback
    }
  }
};

export default StorageService;
