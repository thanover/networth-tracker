import { api } from './client';

export const accountsApi = {
  list:   ()         => api.get('/accounts'),
  create: (data)     => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  remove: (id)       => api.del(`/accounts/${id}`),
};
