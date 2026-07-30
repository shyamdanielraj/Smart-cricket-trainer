import axios from 'axios'
import { env } from '../env'

export const api = axios.create({
  baseURL: env.apiBaseUrl,
})

export function setApiToken(token: string | null) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

