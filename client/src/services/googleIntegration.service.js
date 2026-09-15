import { api } from './api'

export const googleIntegrationService = {
  status: () => api.get('/integrations/google/status').then(({ data }) => data),
  connect: () => api.post('/integrations/google/connect').then(({ data }) => data),
  disconnect: () => api.delete('/integrations/google/connection'),
}
