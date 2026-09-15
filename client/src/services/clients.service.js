import { api } from './api'

export const clientsService = {
  getAll: () => api.get('/clients').then(({ data }) => data),
  create: (payload) => api.post('/clients', payload).then(({ data }) => data),
}
