import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Wrapper function to handle API calls gracefully
const safeApiCall = async (apiCall) => {
  try {
    return await apiCall()
  } catch (error) {
    // Silently handle network errors - localStorage fallbacks will be used
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      throw new Error('API_UNAVAILABLE')
    }
    throw error
  }
}

// Folders API
export const foldersApi = {
  getAll: () => safeApiCall(() => api.get('/folders/')),
  getById: (id) => safeApiCall(() => api.get(`/folders/${id}`)),
  create: (data) => safeApiCall(() => api.post('/folders/', data)),
  update: (id, data) => safeApiCall(() => api.put(`/folders/${id}`, data)),
  delete: (id) => safeApiCall(() => api.delete(`/folders/${id}`)),
}

// Notes API
export const notesApi = {
  getAll: (folderId = null) => safeApiCall(() => api.get('/notes/', { params: folderId ? { folder_id: folderId } : {} })),
  getById: (id) => safeApiCall(() => api.get(`/notes/${id}`)),
  create: (data) => safeApiCall(() => api.post('/notes/', data)),
  update: (id, data) => safeApiCall(() => api.put(`/notes/${id}`, data)),
  delete: (id) => safeApiCall(() => api.delete(`/notes/${id}`)),
}

// Todos API
export const todosApi = {
  getAll: (completed = null) => safeApiCall(() => api.get('/todos/', { params: completed !== null ? { completed } : {} })),
  getById: (id) => safeApiCall(() => api.get(`/todos/${id}`)),
  create: (data) => safeApiCall(() => api.post('/todos/', data)),
  update: (id, data) => safeApiCall(() => api.put(`/todos/${id}`, data)),
  delete: (id) => safeApiCall(() => api.delete(`/todos/${id}`)),
  toggle: (id) => safeApiCall(() => api.patch(`/todos/${id}/toggle`)),
}

export default api
