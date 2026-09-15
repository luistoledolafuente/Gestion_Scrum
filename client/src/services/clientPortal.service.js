import { api } from './api'

export const clientPortalService = {
  getByToken: (token) => api.get(`/client-portal/${token}`).then(({ data }) => data),
}
