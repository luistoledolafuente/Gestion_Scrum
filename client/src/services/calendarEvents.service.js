import { api } from './api'

export const calendarEventsService = {
  getAll: (params = {}) => api.get('/calendar-events', { params }).then(({ data }) => data),
  create: (payload) => api.post('/calendar-events', payload).then(({ data }) => data),
  update: (id, payload) => api.patch(`/calendar-events/${id}`, payload).then(({ data }) => data),
  remove: (id) => api.delete(`/calendar-events/${id}`).then(({ data }) => data),
}
