
import { useEffect, useState } from 'react'
import {
  getStudents,
  getStudentImageUrl,
  createStudent,
  uploadStudentImage,
  updateStudent,
  deleteStudent,
} from './services/studentApi'

function App() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [deletingId, setDeletingId] = useState(null)

  // Fetch students whenever the refresh key changes.
  useEffect(() => {
    let cancelled = false

    async function fetchStudents() {
      try {
        setError('')
        const data = await getStudents()

        if (!cancelled) {
          setStudents(data)
        }
      } catch (err) {
        console.error('Failed to load students:', err)

        if (!cancelled) {
          setError(
            'Unable to load students. Check that the backend is running.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchStudents()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  function refreshStudents() {
    setRefreshKey((current) => current + 1)
  }

  function openAddForm() {
    setActionError('')
    setEditingStudent(null)
    setShowForm(true)
  }

  function openEditForm(student) {
    setActionError('')
    setShowForm(false)
    setEditingStudent(student)
  }

  function closeForm() {
    setShowForm(false)
    setEditingStudent(null)
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name}?`,
    )

    if (!confirmed) return

    try {
      setActionError('')
      setDeletingId(student.id)

      await deleteStudent(student.id)

      // Update the list immediately after successful deletion.
      setStudents((current) =>
        current.filter((item) => item.id !== student.id),
      )
    } catch (err) {
      console.error('Failed to delete student:', err)

      const message =
        err.response?.data?.message ||
        'Unable to delete student. Please try again.'

      setActionError(
        Array.isArray(message) ? message.join(', ') : message,
      )
    } finally {
      setDeletingId(null)
    }
  }

  const filteredStudents = students.filter((student) =>
    `${student.name} ${student.email} ${student.course}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="w-full bg-slate-900 p-6 text-white md:min-h-screen md:w-64">
        <h1 className="text-2xl font-bold">
          Student<span className="text-blue-400">Hub</span>
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Student Management
        </p>

        <nav className="mt-8 space-y-2">
          <a
            href="#dashboard"
            className="block rounded-lg bg-blue-600 px-4 py-3 font-medium"
          >
            Dashboard
          </a>

          <a
            href="#students"
            className="block rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800"
          >
            Students
          </a>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="mt-1 text-slate-500">
              Manage your student records in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Add Student
          </button>
        </header>

        {actionError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        {showForm && (
          <StudentForm
            key="new-student"
            onClose={closeForm}
            onStudentSaved={refreshStudents}
          />
        )}

        {editingStudent && (
          <StudentForm
            key={editingStudent.id}
            student={editingStudent}
            onClose={closeForm}
            onStudentSaved={refreshStudents}
          />
        )}

        <section
          id="dashboard"
          className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <StatCard
            title="Total Students"
            value={students.length}
            description="Student records"
          />

          <StatCard
            title="Courses"
            value={new Set(
              students.map((student) => student.course),
            ).size}
            description="Unique courses"
          />

          <StatCard
            title="Filtered Results"
            value={filteredStudents.length}
            description="Matching your search"
          />
        </section>

        <section
          id="students"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h3 className="text-xl font-bold">Students</h3>
              <p className="mt-1 text-sm text-slate-500">
                View, search, edit and delete student records.
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Course</th>
                  <th className="px-5 py-4 font-semibold">Age</th>
                  <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center"
                    >
                      Loading students...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-red-600"
                    >
                      {error}
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getStudentImageUrl(student.id)}
                            alt={`${student.name}'s profile`}
                            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none'
                            }}
                          />

                          <span className="font-medium">
                            {student.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.email}
                      </td>

                      <td className="px-5 py-4">
                        {student.course}
                      </td>

                      <td className="px-5 py-4">
                        {student.age}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(student)}
                            disabled={deletingId === student.id}
                            className="rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(student)}
                            disabled={deletingId === student.id}
                            className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            {deletingId === student.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading &&
                  !error &&
                  filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        {students.length === 0
                          ? 'No students have been added yet.'
                          : 'No students match your search.'}
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-slate-400">
          StudentHub · Student Management System
        </p>
      </main>
    </div>
  )
}

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  )
}

function StudentForm({ student, onClose, onStudentSaved }) {
  const isEditing = Boolean(student)

  const [formData, setFormData] = useState({
    name: student?.name ?? '',
    email: student?.email ?? '',
    age: student ? String(student.age) : '',
    course: student?.course ?? '',
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageError, setImageError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleImageChange(event) {
    const file = event.target.files?.[0]

    setImageError('')
    setImageFile(null)
    setImagePreview('')

    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setImageError(
        'Only JPEG, PNG, and WebP images are allowed.',
      )
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must not exceed 5 MB.')
      event.target.value = ''
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setImageError('')
    setSaving(true)

    try {
      const studentData = {
        ...formData,
        age: Number(formData.age),
      }

      let savedStudent

      if (isEditing) {
        // Update the existing student's details.
        savedStudent = await updateStudent(
          student.id,
          studentData,
        )
      } else {
        // Create the student first to obtain the database ID.
        savedStudent = await createStudent(studentData)
      }

      // Upload a photo only when a new photo was selected.
      if (imageFile) {
        await uploadStudentImage(
          savedStudent.id ?? student?.id,
          imageFile,
        )
      }

      // Refresh the list after all requested operations succeed.
      onStudentSaved()
      onClose()
    } catch (err) {
      console.error(
        isEditing
          ? 'Failed to update student:'
          : 'Failed to save student:',
        err,
      )

      const message =
        err.response?.data?.message ||
        (isEditing
          ? 'Unable to update student. Please try again.'
          : 'Unable to save student. Please try again.')

      setImageError(
        Array.isArray(message) ? message.join(', ') : message,
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold">
          {isEditing ? 'Edit Student' : 'Add New Student'}
        </h3>

        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 sm:grid-cols-2"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Full Name
          </label>

          <input
            required
            maxLength={100}
            value={formData.name}
            onChange={(event) =>
              setFormData({
                ...formData,
                name: event.target.value,
              })
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            required
            type="email"
            maxLength={255}
            value={formData.email}
            onChange={(event) =>
              setFormData({
                ...formData,
                email: event.target.value,
              })
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="student@example.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Age
          </label>

          <input
            required
            type="number"
            min={1}
            max={120}
            step={1}
            value={formData.age}
            onChange={(event) =>
              setFormData({
                ...formData,
                age: event.target.value,
              })
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="Enter age"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Course
          </label>

          <input
            required
            maxLength={100}
            value={formData.course}
            onChange={(event) =>
              setFormData({
                ...formData,
                course: event.target.value,
              })
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            placeholder="e.g. Computer Science"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">
            {isEditing
              ? 'Change Student Photo (optional)'
              : 'Student Photo'}
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm"
          />

          {isEditing && !imagePreview && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={getStudentImageUrl(student.id)}
                alt={`${student.name}'s current profile`}
                className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />

              <p className="text-sm text-slate-500">
                Current photo. Select a new file to replace it.
              </p>
            </div>
          )}

          {imageError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {imageError}
            </p>
          )}

          {imagePreview && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">
                Image Preview
              </p>

              <img
                src={imagePreview}
                alt="Selected student"
                className="h-32 w-32 rounded-xl border border-slate-200 object-cover"
              />

              <p className="mt-2 text-sm text-slate-500">
                {imageFile?.name}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : isEditing
                ? 'Update Student'
                : 'Save Student'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
