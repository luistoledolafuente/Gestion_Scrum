import axios from 'axios'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const workspaceId = window.localStorage.getItem('momentum_workspace_id')
  if (workspaceId) config.headers['X-Workspace-Id'] = workspaceId
  return config
})

export const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'No se pudo completar la solicitud'
