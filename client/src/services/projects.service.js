import { api } from './api'

export const projectsService = {
  getAll: () => api.get('/projects').then(({ data }) => data),
  getById: (id) => api.get(`/projects/${id}`).then(({ data }) => data),
  create: (payload) => api.post('/projects', payload).then(({ data }) => data),
  update: (id, payload) => api.patch(`/projects/${id}`, payload).then(({ data }) => data),
  remove: (id) => api.delete(`/projects/${id}`),
  createBacklogItem: (payload) => api.post('/backlog-items', payload).then(({ data }) => data),
}
