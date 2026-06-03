import { createContext, useContext, useState, useEffect } from 'react';
import societyConfig from '../config/society';
import { isLiveMode } from '../config/appMode';
import { getCurrentUser, loginWithApi, clearAuthToken } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (!isLiveMode) return;
    if (!localStorage.getItem('auth_token')) return;

    getCurrentUser()
      .then((res) => {
        if (res?.user) setUser(res.user);
      })
      .catch(() => {
        clearAuthToken();
        setUser(null);
      });
  }, []);

  const login = async (username, password) => {
    if (isLiveMode) {
      const res = await loginWithApi(username, password);
      if (res?.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password' };
    }

    const creds = societyConfig.demoCredentials;
    for (const key of Object.keys(creds)) {
      const configuredUsername = creds[key].username;
      const configuredPassword = creds[key].password;

      // Ignore credential entries that are not configured in environment variables.
      if (!configuredUsername || !configuredPassword) continue;

      if (configuredUsername === username && configuredPassword === password) {
        const userData = { username, role: creds[key].role, name: creds[key].name };
        // Demo residents aren't linked to a flat server-side; pin one so flat-scoped demo
        // features (My Flat, governance voting/RSVP) work without a backend.
        if (creds[key].role === 'member') userData.flatNumber = 'A-101';
        setUser(userData);
        return { success: true };
      }
    }
    return { success: false, error: 'Invalid username or password' };
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
