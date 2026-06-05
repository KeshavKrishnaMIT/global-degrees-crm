import axios from 'axios'

const BASE_URL = 'https://global-degrees-crm.onrender.com'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong'

    console.error(message)

    return Promise.reject(
      new Error(message)
    )
  }
)

export const analyticsAPI = {
  getSummary: () =>
    api.get('/analytics')
}

export const studentsAPI = {
  getStudents: () =>
    api.get('/students'),

  getHotLeads: () =>
    api.get('/hot-leads')
}

export const counselorsAPI = {
  getAll: () =>
    api.get('/counselors')
}

export const scholarshipAPI = {
  getByStudentId: (id) =>
    api.get(`/scholarship/${id}`)
}

export const healthAPI = {
  check: () =>
    api.get('/test')
}

export default api