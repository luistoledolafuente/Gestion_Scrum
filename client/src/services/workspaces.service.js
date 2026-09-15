import { api } from './api'

export const workspacesService = {
  members: () => api.get('/workspaces/current/members').then(({ data }) => data),
  addMember: (payload) => api.post('/workspaces/current/members', payload).then(({ data }) => data),
  updateMember: (id, role) => api.patch(`/workspaces/current/members/${id}`, { role }).then(({ data }) => data),
  removeMember: (id) => api.delete(`/workspaces/current/members/${id}`),
}
