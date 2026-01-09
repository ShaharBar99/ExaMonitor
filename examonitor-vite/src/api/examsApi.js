// examsApi.js
import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

export const examsApi = {
  listExams: async (status) => {
    if (useMock) return [];
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return apiFetch(`/exams${query}`);
  },

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

  updateExamStatus: async (examId, status) =>
    apiFetch(`/exams/${examId}/status`, {
      method: "PATCH",
      body: { status }
    }),

  broadcastAnnouncement: async (examId, message) =>
    apiFetch(`/exams/${examId}/broadcast`, {
      method: "POST",
      body: { message }
    }),
};
