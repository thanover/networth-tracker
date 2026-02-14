import { api } from './client';

export const userApi = {
  getProfile: () => api.get('/user'),
  updateBirthday: (birthday) => api.patch('/user', { birthday }),
};
