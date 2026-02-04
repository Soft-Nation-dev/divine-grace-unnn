// =============================================
// API Configuration for Frontend
// =============================================

// Determine API base URL based on environment
const getApiUrl = () => {
  // Check if VITE_API_URL is set in .env
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default URLs based on environment
  if (import.meta.env.MODE === "production") {
    return import.meta.env.VITE_API_URL || "https://api.divinegraceunn.com.ng";
  }

  return "http://localhost:3001";
};

export const API_BASE_URL = getApiUrl();

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  SIGNUP: "/api/auth/signup",
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",
  PROFILE: "/api/auth/profile",
  UPDATE_PROFILE: "/api/auth/profile",
  REFRESH_TOKEN: "/api/auth/refresh",

  // Prayers
  GET_PRAYERS: "/api/prayers",
  POST_PRAYER: "/api/prayers",
  GET_PRAYER: (id) => `/api/prayers/${id}`,

  // LSTS
  GET_LSTS: "/api/lsts",
  POST_LSTS: "/api/lsts",
  GET_LSTS_WEEKLY: "/api/lsts/weekly",
  GET_USER_LSTS: "/api/lsts/user/all",
  GET_USER_LSTS_WEEK: "/api/lsts/user/week",
  GET_LSTS_BY_ID: (id) => `/api/lsts/${id}`,

  // Summit
  GET_SUMMIT: "/api/summit",
  POST_SUMMIT: "/api/summit",
  GET_USER_SUMMIT: "/api/summit/user/all",
  GET_SUMMIT_BY_ID: (id) => `/api/summit/${id}`,

  // Messages
  UPLOAD_MESSAGE: "/api/messages/upload",
  GET_MESSAGES: "/api/messages",
  GET_PUBLIC_MESSAGES: "/api/messages/public/all",
  DELETE_MESSAGE: (id) => `/api/messages/${id}`,

  // Admin
  CHECK_ADMIN: "/api/admin/check",
  ASSIGN_ADMIN: "/api/admin/assign",
  ADMIN_DASHBOARD: "/api/admin/dashboard",
  GET_ALL_USERS: "/api/admin/users/all",
  GET_ALL_ADMINS: "/api/admin/admins/all",
};

// Helper function to get auth token
export const getAuthToken = () => {
  return sessionStorage.getItem("authToken");
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  sessionStorage.setItem("authToken", token);
};

// Helper function to remove auth token
export const removeAuthToken = () => {
  sessionStorage.removeItem("authToken");
};

// Helper function for authenticated fetch calls
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    removeAuthToken();
    window.location.href = "/login";
  }

  return response;
};

export default API_BASE_URL;
