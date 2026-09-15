import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
})

export const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'No se pudo completar la solicitud'
