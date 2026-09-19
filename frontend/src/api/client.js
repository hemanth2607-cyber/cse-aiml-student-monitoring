import axios from "axios";

// 1. Get the base backend URL supporting both VITE_API_BASE_URL and VITE_API_URL
const rawApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// Ensure clean URL without duplicate trailing slashes or duplicate /api/v1
const cleanBase = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
const apiBase = `${cleanBase}/api/v1`;

const api = axios.create({
  baseURL: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor – attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      document.cookie?.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/student-login") ||
      url.includes("/auth/admin-login") ||
      url.includes("/auth/verify-otp") ||
      url.includes("/auth/send-otp") ||
      url.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      document.cookie = "access_token=; Max-Age=0; path=/";
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/login") && currentPath !== "/" && currentPath !== "/verify") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;