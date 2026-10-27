
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD ? '/api' : 'http://localhost:3000'
  ),
})

// READ: Get all students
export async function getStudents() {
  const response = await api.get('/students')
  return response.data
}

// Get a student's image URL
export function getStudentImageUrl(studentId) {
  return `${api.defaults.baseURL}/students/${studentId}/image`
}

// CREATE: Add a new student
export async function createStudent(studentData) {
  const response = await api.post('/students', studentData)
  return response.data
}

// UPLOAD: Upload a student's image
export async function uploadStudentImage(studentId, imageFile) {
  const formData = new FormData()
  formData.append('image', imageFile)

  const response = await api.post(
    `/students/${studentId}/image`,
    formData,
  )

  return response.data
}

// UPDATE: Partially update a student's details
export async function updateStudent(studentId, studentData) {
  const response = await api.patch(
    `/students/${studentId}`,
    studentData,
  )

  return response.data
}

// DELETE: Remove a student
export async function deleteStudent(studentId) {
  const response = await api.delete(`/students/${studentId}`)
  return response.data
}

export default api
