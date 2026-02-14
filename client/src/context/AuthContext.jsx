import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token && username ? { token, username } : null;
  });

  const login = useCallback(async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    setUser({ token: data.token, username: data.username });
  }, []);

  const register = useCallback(async (username, password) => {
    const data = await api.post('/auth/register', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    setUser({ token: data.token, username: data.username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
