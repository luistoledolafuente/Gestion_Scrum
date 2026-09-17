import { api, API_BASE_URL } from './api'

export const authService = {
  me: () => api.get('/auth/me').then(({ data }) => data),
  login: (payload) => api.post('/auth/login', payload).then(({ data }) => data),
  register: (payload) => api.post('/auth/register', payload).then(({ data }) => data),
  logout: () => api.post('/auth/logout'),
  googleLoginUrl: `${API_BASE_URL}/auth/google/start`,
}
