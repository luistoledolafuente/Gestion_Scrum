import { api } from './api'

export const sprintsService = {
  getAll: (projectId) => api.get('/sprints', { params: projectId ? { projectId } : {} }).then(({ data }) => data),
  getById: (id) => api.get(`/sprints/${id}`).then(({ data }) => data),
  getMetrics: (id) => api.get(`/metrics/sprint/${id}`).then(({ data }) => data),
  create: (payload) => api.post('/sprints', payload).then(({ data }) => data),
  createItem: (payload) => api.post('/sprint-items', payload).then(({ data }) => data),
  updateItem: (id, payload) => api.patch(`/sprint-items/${id}`, payload).then(({ data }) => data),
}
