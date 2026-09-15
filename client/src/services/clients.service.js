import { api } from './api'

export const clientsService = {
  getAll: () => api.get('/clients').then(({ data }) => data),
  create: (payload) => api.post('/clients', payload).then(({ data }) => data),
  update: (id, payload) => api.patch(`/clients/${id}`, payload).then(({ data }) => data),
  remove: (id) => api.delete(`/clients/${id}`),
}
