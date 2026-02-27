import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 second timeout for fast failure
});

// ─── Request Interceptor: Auth Token ────────────────────
api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Simple In-Memory Cache ─────────────────────────────
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds for GET requests

const getCachedData = (key) => {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
    }
    cache.delete(key);
    return null;
};

const setCachedData = (key, data) => {
    // Limit cache size
    if (cache.size > 100) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
    cache.set(key, { data, timestamp: Date.now() });
};

// ─── Response Interceptor: Auto-cache GET requests ──────
api.interceptors.response.use((response) => {
    if (response.config.method === 'get' && response.config.responseType !== 'blob' && response.config.responseType !== 'arraybuffer') {
        const key = response.config.url + (response.config.params ? JSON.stringify(response.config.params) : '');
        setCachedData(key, response.data);
    }
    return response;
});

// ─── Cached GET helper ──────────────────────────────────
api.cachedGet = async (url, config = {}) => {
    const key = url + (config.params ? JSON.stringify(config.params) : '');
    const cached = getCachedData(key);
    if (cached) {
        return { data: cached, fromCache: true };
    }
    return api.get(url, config);
};

// ─── Clear cache (call after mutations) ─────────────────
api.clearCache = () => cache.clear();

export default api;
