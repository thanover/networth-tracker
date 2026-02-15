import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '@/api/client';
import { userApi } from '@/api/user';

const AuthContext = createContext(null);

const DEFAULT_INFLATION = 3.5;

function profileFromStorage(token, username) {
  if (!token || !username) return null;
  return {
    token,
    username,
    birthday: localStorage.getItem('birthday') || null,
    inflationRate: localStorage.getItem('inflationRate') != null
      ? parseFloat(localStorage.getItem('inflationRate'))
      : DEFAULT_INFLATION,
  };
}

function persistProfile(profile) {
  if (profile.birthday) localStorage.setItem('birthday', profile.birthday);
  else localStorage.removeItem('birthday');
  localStorage.setItem('inflationRate', profile.inflationRate ?? DEFAULT_INFLATION);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    profileFromStorage(localStorage.getItem('token'), localStorage.getItem('username'))
  );

  const login = useCallback(async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    const profile = await userApi.getProfile();
    const next = {
      token: data.token,
      username: data.username,
      birthday: profile.birthday ?? null,
      inflationRate: profile.inflationRate ?? DEFAULT_INFLATION,
    };
    persistProfile(next);
    setUser(next);
  }, []);

  const register = useCallback(async (username, password) => {
    const data = await api.post('/auth/register', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    const profile = await userApi.getProfile();
    const next = {
      token: data.token,
      username: data.username,
      birthday: profile.birthday ?? null,
      inflationRate: profile.inflationRate ?? DEFAULT_INFLATION,
    };
    persistProfile(next);
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('birthday');
    localStorage.removeItem('inflationRate');
    setUser(null);
  }, []);

  const updateBirthday = useCallback(async (isoString) => {
    const profile = await userApi.updateBirthday(isoString);
    const birthday = profile.birthday ?? null;
    if (birthday) localStorage.setItem('birthday', birthday);
    else localStorage.removeItem('birthday');
    setUser(prev => ({ ...prev, birthday }));
  }, []);

  const updateInflationRate = useCallback(async (rate) => {
    const profile = await userApi.updateInflationRate(rate);
    const inflationRate = profile.inflationRate ?? DEFAULT_INFLATION;
    localStorage.setItem('inflationRate', inflationRate);
    setUser(prev => ({ ...prev, inflationRate }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateBirthday, updateInflationRate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
