import { api } from './api'

export const reportsService = {
  getPortfolio: () => api.get('/reports/portfolio').then(({ data }) => data),
}
