import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
})

// Automatically attach auth token to every request
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export const scanText = async (text: string) => {
  const res = await api.post('/scan/text', { text })
  return res.data
}

export const scanCode = async (code: string) => {
  const res = await api.post('/scan/code', { code })
  return res.data
}

export const scanImage = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/scan/image', formData)
  return res.data
}

export const getHistory = async (limit = 20, offset = 0, modality?: string) => {
  const res = await api.get('/history', { params: { limit, offset, modality } })
  return res.data
}

export const getCredits = async () => {
  const res = await api.get('/credits')
  return res.data
}