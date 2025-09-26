// AuthContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useToast } from "./ToastContext";
import { getErrorMessage } from "../utils/getErrorMessage";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// --- AXIOS INSTANCES ---
export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {},
  withCredentials: true,
});

export const authApiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// --- AUTHCONTEXT DEFINITION ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { showToast } = useToast();

  const getInitialAccessToken = () => {
    const lsToken = localStorage.getItem("accessToken");
    if (lsToken) return lsToken;
    const ssToken = sessionStorage.getItem("accessToken");
    return ssToken;
  };

  // STATE MANAGEMENT
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(getInitialAccessToken());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const isRefreshing = useRef(false);
  const logoutInitiated = useRef(false);
  const failedQueue = useRef([]);
  const refreshPromise = useRef(null);

  // Update Auth State
  const setAuthData = useCallback(
    (userData, newAccessToken, isRememberMe = false) => {
      setUser((prevUser) => {
        if (JSON.stringify(prevUser) === JSON.stringify(userData))
          return prevUser;
        return userData;
      });

      setAccessToken((prevToken) => {
        if (prevToken === newAccessToken) return prevToken;
        return newAccessToken;
      });

      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");

      if (newAccessToken) {
        if (isRememberMe) {
          localStorage.setItem("accessToken", newAccessToken);
        } else {
          sessionStorage.setItem("accessToken", newAccessToken);
        }
      }
      setAuthError(null);
    },
    []
  );

  // Logout Function
  const logout = useCallback(
    async (_, message = null) => {
      if (logoutInitiated.current) {
        return;
      }
      logoutInitiated.current = true;

      setLoading(true);
      setAuthError(null);

      try {
        await authApiClient.post("/api/auth/logout");
        if (message) {
          showToast(message, "info");
        } else {
          showToast("You have been logged out.", "info");
        }
      } catch (err) {
        console.error(
          "AuthContext: Logout API call failed, but clearing local state.",
          err
        );
        if (message) {
          showToast(message, "error");
        } else {
          showToast("Logout failed, but local state cleared.", "error");
        }
      } finally {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        setAuthData(null, null);
        setLoading(false);
        refreshPromise.current = null;
        failedQueue.current = [];
        logoutInitiated.current = false;
      }
    },
    [setAuthData, showToast]
  );

  // Refresh Access Token
  const refreshAccessToken = useCallback(async () => {
    if (!isRefreshing.current) {
      isRefreshing.current = true;

      setLoading(true);
      setAuthError(null);

      try {
        const response = await authApiClient.post("/api/auth/refresh");
        const { accessToken: newAccessToken, user: newUserData } =
          response.data;

        if (newAccessToken && newUserData) {
          const originalRememberMePreference =
            !!localStorage.getItem("accessToken");
          setAuthData(
            newUserData,
            newAccessToken,
            originalRememberMePreference
          );
          showToast("Session refreshed!", "success");

          failedQueue.current.forEach((callback) =>
            callback.resolve(newAccessToken)
          );
          failedQueue.current = [];

          return newAccessToken;
        } else {
          throw new Error("Failed to get new access token during refresh.");
        }
      } catch (refreshError) {
        if (refreshError.response) {
          console.error(
            "AuthContext: Refresh error:",
            refreshError.response.status,
            refreshError.response.data
          );
        } else {
          console.error("AuthContext: Refresh error:", refreshError.message);
        }
        failedQueue.current.forEach((callback) =>
          callback.reject(refreshError)
        );
        failedQueue.current = [];

        if (!logoutInitiated.current) {
          logout("Your session expired. Please log in again.");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing.current = false;
        setLoading(false);
        refreshPromise.current = null;
      }
    } else {
      return new Promise((resolve, reject) => {
        failedQueue.current.push({ resolve, reject });
      });
    }
  }, [setAuthData, logout, showToast]);

  // Initial Load/Token Validation
  useEffect(() => {
    const initializeAuth = async () => {
      if (user !== null) {
        setLoading(false);
        return;
      }

      setAuthError(null);
      const storedAccessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (storedAccessToken) {
        try {
          const decodedToken = jwtDecode(storedAccessToken);

          if (decodedToken.exp * 1000 < Date.now() + 5000) {
            await refreshAccessToken();
          } else {
            if (user === null) {
              setUser({
                id: decodedToken.id,
                username: decodedToken.username,
                isAdmin: decodedToken.isAdmin,
              });
            }
            setAccessToken(storedAccessToken);

            if (user === null) {
              showToast("Welcome back!", "info");
            }
          }
        } catch (err) {
          if (err.response) {
            console.error(
              "AuthContext: Init error response:",
              err.response.status,
              err.response.data
            );
          } else {
            console.error("AuthContext: Init error:", err.message);
          }

          if (!logoutInitiated.current) {
            logout("Authentication error. Please log in again.");
          }
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [refreshAccessToken, logout, showToast]);

  // Axios Interceptors
  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        const currentAccessToken =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");

        if (currentAccessToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${currentAccessToken}`;
        } else if (!currentAccessToken) {
          console.log(
            "AuthContext: Request Interceptor: No access token found."
          );
        }
        return config;
      },
      (err) => {
        return Promise.reject(err);
      }
    );

    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (err) => {
        const originalRequest = err.config;

        if (err.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          refreshPromise.current = refreshPromise.current
            ? refreshPromise.current
            : refreshAccessToken();

          try {
            const newAccessToken = await refreshPromise.current;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } catch (refreshError) {
            if (refreshError.response) {
              console.error(
                "AuthContext: Interceptor refresh error:",
                refreshError.response.status,
                refreshError.response.data
              );
            } else {
              console.error(
                "AuthContext: Interceptor refresh error:",
                refreshError.message
              );
            }
            return Promise.reject(err);
          }
        }
        return Promise.reject(err);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccessToken, logout, showToast]);

  // Login Function
  const login = useCallback(
    async (email, password, rememberMe) => {
      setLoading(true);
      setAuthError(null);

      try {
        const response = await authApiClient.post("/api/auth/login", {
          email,
          password,
          rememberMe,
        });

        const { accessToken: receivedAccessToken, user: userData } =
          response.data;
        if (receivedAccessToken && userData) {
          setAuthData(userData, receivedAccessToken, rememberMe);
          showToast("Logged in successfully!", "success");
          return { success: true };
        } else {
          throw new Error("Invalid response from server during login.");
        }
      } catch (err) {
        const errorMessage = getErrorMessage(
          err,
          "Login failed. Please check your credentials."
        );
        setAuthError(errorMessage);
        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [setAuthData, showToast]
  );

  // Signup Function
  const signup = useCallback(
    async (formData) => {
      setLoading(true);
      setAuthError(null);

      try {
        const response = await authApiClient.post("/api/auth/signup", formData);
        const { accessToken: receivedAccessToken, user: userData } =
          response.data;
        if (receivedAccessToken && userData) {
          setAuthData(userData, receivedAccessToken, false);
          showToast(
            "Registration successful! You are now logged in.",
            "success"
          );
          return { success: true };
        } else {
          throw new Error(
            "Invalid response from the server during registration."
          );
        }
      } catch (err) {
        const errorMessage = getErrorMessage(
          err,
          "Registration failed. Please try again."
        );
        setAuthError(errorMessage);
        showToast(errorMessage, "error");
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [setAuthData, showToast]
  );

  const authContextValue = {
    user,
    accessToken,
    login,
    logout,
    signup,
    isAuthenticated: !!accessToken,
    loading: loading,
    authError,
    apiClient,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
};
