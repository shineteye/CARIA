import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  login as loginApi,
  register as registerApi,
  fetchMe,
  logout as logoutApi,
  clearAuthToken,
  getStoredToken,
} from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "Caria_auth_token";
const SESSION_KEY = "Caria_session_id";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
    }
    setUser(nextUser || null);
  }, []);

  const clearAuth = useCallback(() => {
    clearAuthToken();
    localStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = getStoredToken();
      if (!stored) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const { user: me } = await fetchMe();
        if (!cancelled) {
          setToken(stored);
          setUser(me);
        }
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearAuth]);

  const login = useCallback(
    async (email, password, sessionId) => {
      const data = await loginApi(email, password, sessionId);
      applyAuth(data.token, data.user);
      return data;
    },
    [applyAuth],
  );

  const register = useCallback(
    async (name, email, password, sessionId) => {
      const data = await registerApi(name, email, password, sessionId);
      applyAuth(data.token, data.user);
      return data;
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* ignore network errors on logout */
    }
    clearAuth();
  }, [clearAuth]);

  const updateUser = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!user && !!token,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, loading, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
