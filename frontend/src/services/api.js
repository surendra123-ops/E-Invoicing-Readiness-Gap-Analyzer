import axios from 'axios'

// Use environment variable for API URL, fallback to current domain for production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:3000'

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

export const getUploadHistory = async (limit = 20, offset = 0) => {
  const response = await api.get(`/upload/history?limit=${limit}&offset=${offset}`)
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

// Rules endpoints
export const checkRules = async (uploadId) => {
  const response = await api.post('/rules/check', { uploadId })
  return response.data
}

export const getValidationResults = async (validationId) => {
  const response = await api.get(`/rules/results/${validationId}`)
  return response.data
}

export const getValidationByUploadId = async (uploadId) => {
  const response = await api.get(`/rules/upload/${uploadId}`)
  return response.data
}

export const getRuleDefinitions = async () => {
  const response = await api.get('/rules/definitions')
  return response.data
}

// Reports endpoints
export const getReportSummary = async (uploadId) => {
  const response = await api.get(`/reports/${uploadId}/summary`)
  return response.data
}

export const downloadReport = async (uploadId, format = 'json') => {
  const response = await api.get(`/reports/${uploadId}?format=${format}`, {
    responseType: 'blob'
  })
  
  // Create download link
  const blob = new Blob([response.data])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  
  // Set filename based on format
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `e-invoicing-readiness-report-${timestamp}.${format}`
  link.download = filename
  
  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  
  return { success: true, filename }
}

export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

// Analyze endpoint
export const analyzeData = async (uploadId, questionnaire = {}) => {
  const response = await api.post('/analyze', { uploadId, questionnaire })
  return response.data
}

// Get report by ID
export const getReport = async (reportId) => {
  const response = await api.get(`/report/${reportId}`)
  return response.data
}

export default api
