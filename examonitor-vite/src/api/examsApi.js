// examsApi.js
import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

/**
 * API for managing exams.
 */
export const examsApi = {
  /**
   * Lists exams, optionally filtered by status.
   * @param {string} status - The status to filter by (e.g., 'active', 'pending').
   * @returns {Promise<Array>} List of exams.
   */
  listExams: async (status) => {
    if (useMock) return [];
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return apiFetch(`/exams${query}`);
  },

  /**
   * Lists courses associated with exams.
   * @returns {Promise<Array>} List of courses.
   */
  listCourses: async () => {
    if (useMock) return [];
    return apiFetch('/exams/courses'); // Note the path matches the route below
  },

  /**
   * Retrieves details for a specific exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<Object>} The exam details.
   */
  getExamById: async (examId) => {
    if (useMock) {
      return {
        id: examId,
        course_id: "CS101",
        original_start_time: new Date().toISOString(),
        original_duration: 180,
        extra_time: 0,
        status: "active"
      };
    }
    return apiFetch(`/exams/${examId}`);
  },




  //added for new tables
  /**
   * Gets lecturers for a specific course.
   * @param {string} courseId - The course ID.
   * @returns {Promise<Object>} List of lecturers.
   */
  getCourseLecturers: (courseId) =>
    apiFetch(`/exams/courses/${courseId}/lecturers`),

  /**
   * Gets lecturers assigned to a specific exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<Object>} List of lecturers.
   */
  getExamLecturers: (examId) =>
    apiFetch(`/exams/${examId}/lecturers`),

  /**
   * Adds a lecturer to an exam.
   * @param {string} examId - The exam ID.
   * @param {string} lecturerId - The lecturer ID.
   * @returns {Promise<Object>} The result.
   */
  addExamLecturer: (examId, lecturerId) =>
    apiFetch(`/exams/${examId}/lecturers`, {
      method: 'POST',
      body: { lecturerId },
    }),

  /**
   * Removes a lecturer from an exam.
   * @param {string} examId - The exam ID.
   * @param {string} lecturerId - The lecturer ID.
   * @returns {Promise<Object>} The result.
   */
  removeExamLecturer: (examId, lecturerId) =>
    apiFetch(`/exams/${examId}/lecturers/${lecturerId}`, {
      method: 'DELETE',
    }),

  /**
   * Lists exams assigned to a specific lecturer.
   * @param {string} lecturerId - The lecturer ID.
   * @returns {Promise<Object>} List of exams.
   */
  listExamsByLecturer: async (lecturerId) => {
    return apiFetch(`/exams/by-lecturer/${lecturerId}`, { method: 'GET' });
  },

  /**
   * Gets available lecturers for an exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<Object>} List of available lecturers.
   */
  getAvailableExamLecturers: async (examId) => {
    return apiFetch(`/exams/${examId}/available-lecturers`, { method: 'GET' });
  },

  /**
   * Updates the status of an exam.
   * @param {string} examId - The exam ID.
   * @param {string} status - The new status.
   * @param {string} userId - The ID of the user performing the update.
   * @returns {Promise<Object>} The updated exam.
   */
  updateExamStatus: async (examId, status, userId) =>
    apiFetch(`/exams/${examId}/status`, {
      method: "PATCH",
      body: { status, userId }
    }),

  /**
   * Broadcasts an announcement to an exam.
   * @param {string} examId - The exam ID.
   * @param {string} message - The message to broadcast.
   * @returns {Promise<Object>} The result.
   */
  broadcastAnnouncement: async (examId, message) =>
    apiFetch(`/exams/${examId}/broadcast`, {
      method: "POST",
      body: { message }
    }),
  /**
   * Adds extra time to an exam.
   * @param {string} examId - The exam ID.
   * @param {number} additionalMinutes - Minutes to add.
   * @returns {Promise<Object>} The result.
   */
  addExtraTime: async (examId, additionalMinutes) =>
    apiFetch(`/exams/${examId}/extra-time`, {
      method: "PATCH",
      body: { minutes: additionalMinutes }
    }),
};
