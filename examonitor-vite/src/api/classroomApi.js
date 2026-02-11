import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

/**
 * API for managing classrooms.
 */
export const classroomApi = {
  /**
   * Fetches all classrooms visible to the user.
   * @param {string} [examId=null] - Filter classrooms for a specific exam.
   * @param {string} [lecturerId=null] - Filter classrooms for exams by a specific lecturer.
   * @returns {Promise<Array>} List of classrooms.
   */
  getClassrooms: async (examId = null, lecturerId = null) => {
    const params = new URLSearchParams();
    if (examId) params.set('exam_id', examId);
    if (lecturerId) params.set('lecturer_id', lecturerId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/classrooms${qs}`);
  },

  /**
   * Assigns a supervisor to a classroom.
   * @param {string} classroomId - The classroom ID.
   * @param {string} supervisorId - The supervisor ID.
   * @returns {Promise<Object>} The result of the assignment.
   */
  assignSupervisor: async (classroomId, supervisorId) => {
    if (useMock) return { success: true };
    return apiFetch(`/classrooms/${classroomId}/assign`, {
      method: "PATCH",
      body: { supervisor_id: supervisorId }
    });
  },

  /**
   * Retrieves a list of available supervisors.
   * @returns {Promise<Array>} List of supervisors.
   */
  getSupervisors: async () => {
    if (useMock) {
      return [
        { id: "u3", name: "Invigilator One" },
        { id: "u4", name: "Invigilator Two" },
      ];
    }
    const response = await apiFetch('/classrooms/supervisors/list');
    return response.supervisors || [];
  }
};