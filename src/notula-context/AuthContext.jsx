import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

const AUTH_TOKEN_KEY = "notula_auth_token";
const AUTH_USER_KEY = "notula_auth_user";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate session with backend
  const checkSession = useCallback(async () => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      } else {
        // Token expired or invalid
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setUser(null);
        setToken("");
      }
    } catch (err) {
      console.warn("Auth check network error, using cached user if present:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (username, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Gagal masuk. Periksa kembali kredensial Anda.");
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return data.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {}

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken("");
    setUser(null);
  };

  // Helper fetch with auth header
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        ...(options.headers || {}),
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        logout();
      }
      return res;
    },
    [token]
  );

  const isSuperAdmin = user?.role === "superadmin";
  const isModerator = user?.role === "moderator";
  const isGuru = user?.role === "guru";

  const canCreateMeeting = isSuperAdmin || isModerator;
  const canDeleteMeeting = isSuperAdmin;
  const canFinalize = isSuperAdmin;
  const canManageRTL = isSuperAdmin || isModerator;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        authFetch,
        isSuperAdmin,
        isModerator,
        isGuru,
        canCreateMeeting,
        canDeleteMeeting,
        canFinalize,
        canManageRTL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
