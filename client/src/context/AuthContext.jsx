import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '@/api/client';
import { userApi } from '@/api/user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const birthday = localStorage.getItem('birthday') || null;
    return token && username ? { token, username, birthday } : null;
  });

  const login = useCallback(async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    const profile = await userApi.getProfile();
    const birthday = profile.birthday ?? null;
    if (birthday) localStorage.setItem('birthday', birthday);
    else localStorage.removeItem('birthday');
    setUser({ token: data.token, username: data.username, birthday });
  }, []);

  const register = useCallback(async (username, password) => {
    const data = await api.post('/auth/register', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    const profile = await userApi.getProfile();
    const birthday = profile.birthday ?? null;
    if (birthday) localStorage.setItem('birthday', birthday);
    else localStorage.removeItem('birthday');
    setUser({ token: data.token, username: data.username, birthday });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('birthday');
    setUser(null);
  }, []);

  const updateBirthday = useCallback(async (isoString) => {
    const profile = await userApi.updateBirthday(isoString);
    const birthday = profile.birthday ?? null;
    if (birthday) localStorage.setItem('birthday', birthday);
    else localStorage.removeItem('birthday');
    setUser(prev => ({ ...prev, birthday }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateBirthday }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
