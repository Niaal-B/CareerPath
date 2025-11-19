import { api } from '../lib/api'

type TestRequestPayload = {
  interests_snapshot: string
  qualification_snapshot: string
}

export const fetchStudentDashboard = async () => {
  const response = await api.get('student/dashboard/')
  return response.data
}

export const fetchStudentRequests = async () => {
  const response = await api.get('student/test-requests/')
  return response.data
}

export const createStudentTestRequest = async (payload: TestRequestPayload) => {
  const response = await api.post('student/test-requests/', payload)
  return response.data
}

export const fetchAdminDashboard = async () => {
  const response = await api.get('admin/dashboard/')
  return response.data
}

export const fetchAdminTestRequests = async (status?: string) => {
  const response = await api.get('admin/test-requests/', { params: status ? { status } : undefined })
  return response.data
}

export const createPersonalizedTest = async (requestId: number) => {
  const response = await api.post(`admin/test-requests/${requestId}/create-test/`)
  return response.data
}

export const fetchPersonalizedTest = async (testId: number) => {
  const response = await api.get(`admin/tests/${testId}/`)
  return response.data
}

export const fetchPersonalizedTestByRequest = async (requestId: number) => {
  const response = await api.get(`admin/test-requests/${requestId}/test/`)
  return response.data
}

export const createQuestion = async (testId: number, payload: { prompt: string; order: number; options: Array<{ label: string; description: string; order: number }> }) => {
  const response = await api.post(`admin/tests/${testId}/questions/`, payload)
  return response.data
}

export const assignTest = async (testId: number) => {
  const response = await api.post(`admin/tests/${testId}/assign/`)
  return response.data
}

export const fetchStudentTests = async () => {
  const response = await api.get('student/tests/')
  return response.data
}

export const fetchStudentTestDetail = async (testId: number) => {
  const response = await api.get(`student/tests/${testId}/`)
  return response.data
}

export const submitAnswer = async (testId: number, questionId: number, optionId: number) => {
  const response = await api.post(`student/tests/${testId}/answer/`, {
    question_id: questionId,
    option_id: optionId,
  })
  return response.data
}

export const submitTest = async (testId: number) => {
  const response = await api.post(`student/tests/${testId}/submit/`)
  return response.data
}

export const fetchStudentRecommendations = async () => {
  const response = await api.get('student/recommendations/')
  return response.data
}

export const exportRecommendationPDF = async (recommendationId: number) => {
  const response = await api.get(`student/recommendations/${recommendationId}/export/`, {
    responseType: 'blob',
  })
  
  // Create a blob URL and trigger download
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  
  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers['content-disposition']
  let filename = `CareerPath_Recommendation_${recommendationId}.pdf`
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/)
    if (filenameMatch) {
      filename = filenameMatch[1]
    }
  }
  
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  
  return { success: true }
}

export const fetchCompletedTests = async () => {
  const response = await api.get('admin/tests/completed/')
  return response.data
}

export const fetchAdminRecommendations = async () => {
  const response = await api.get('admin/recommendations/')
  return response.data
}

export const fetchTestAnswers = async (testId: number) => {
  const response = await api.get(`admin/tests/${testId}/answers/`)
  return response.data
}

export const createRecommendation = async (testId: number, payload: {
  career_name: string
  summary: string
  steps: Array<{ order: number; title: string; description: string }>
}) => {
  const response = await api.post(`admin/tests/${testId}/recommendation/`, payload)
  return response.data
}

// ========== RESOURCE MANAGEMENT ==========

export const fetchResourceCategories = async () => {
  const response = await api.get('admin/resource-categories/')
  return response.data
}

export const createResourceCategory = async (payload: { name: string; description?: string; icon?: string }) => {
  const response = await api.post('admin/resource-categories/', payload)
  return response.data
}

export const fetchAdminResources = async (recommendationId?: number, categoryId?: number) => {
  const params: any = {}
  if (recommendationId) params.recommendation_id = recommendationId
  if (categoryId) params.category_id = categoryId
  const response = await api.get('admin/resources/', { params })
  return response.data
}

export const createResource = async (payload: {
  career_recommendation?: number
  category?: number
  title: string
  description: string
  resource_type: string
  url?: string
  file?: File
  difficulty_level: string
  is_free: boolean
  cost?: number
  order?: number
  is_active?: boolean
}) => {
  const formData = new FormData()
  Object.keys(payload).forEach((key) => {
    const value = payload[key as keyof typeof payload]
    if (value !== undefined && value !== null) {
      if (key === 'file' && value instanceof File) {
        formData.append(key, value)
      } else {
        formData.append(key, String(value))
      }
    }
  })
  const response = await api.post('admin/resources/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const updateResource = async (resourceId: number, payload: Partial<{
  career_recommendation?: number
  category?: number
  title: string
  description: string
  resource_type: string
  url?: string
  file?: File
  difficulty_level: string
  is_free: boolean
  cost?: number
  order?: number
  is_active?: boolean
}>) => {
  const formData = new FormData()
  Object.keys(payload).forEach((key) => {
    const value = payload[key as keyof typeof payload]
    if (value !== undefined && value !== null) {
      if (key === 'file' && value instanceof File) {
        formData.append(key, value)
      } else {
        formData.append(key, String(value))
      }
    }
  })
  const response = await api.patch(`admin/resources/${resourceId}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const deleteResource = async (resourceId: number) => {
  const response = await api.delete(`admin/resources/${resourceId}/`)
  return response.data
}

export const fetchStudentResources = async (categoryId?: number, resourceType?: string) => {
  const params: any = {}
  if (categoryId) params.category_id = categoryId
  if (resourceType) params.resource_type = resourceType
  const response = await api.get('student/resources/', { params })
  return response.data
}

export const fetchStudentResourceDetail = async (resourceId: number) => {
  const response = await api.get(`student/resources/${resourceId}/`)
  return response.data
}

export const updateResourceProgress = async (resourceId: number, payload: {
  status: string
  notes?: string
  is_favorite?: boolean
}) => {
  const response = await api.post(`student/resources/${resourceId}/progress/`, payload)
  return response.data
}

export const fetchMyResources = async () => {
  const response = await api.get('student/my-resources/')
  return response.data
}
