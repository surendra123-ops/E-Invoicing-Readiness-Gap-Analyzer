import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Upload endpoints
export const uploadFile = async (formData) => {
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const uploadJsonPayload = async (payload) => {
  const response = await api.post('/upload/json', payload)
  return response.data
}

export const getUploadDetails = async (uploadId) => {
  const response = await api.get(`/upload/${uploadId}`)
  return response.data
}

// Fields endpoints
export const getStandardFields = async () => {
  const response = await api.get('/fields')
  return response.data
}

export const mapFields = async (mappingData) => {
  const response = await api.post('/fields/map', mappingData)
  return response.data
}

export const getFieldMappings = async (uploadId) => {
  const response = await api.get(`/fields/mappings/${uploadId}`)
  return response.data
}

export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
