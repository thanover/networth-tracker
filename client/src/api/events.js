import { api } from './client';

export const eventsApi = {
  list:   ()         => api.get('/events'),
  create: (data)     => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  remove: (id)       => api.del(`/events/${id}`),
};
