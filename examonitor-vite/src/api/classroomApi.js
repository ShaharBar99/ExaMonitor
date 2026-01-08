import { apiFetch } from './http';

const useMock = String(import.meta.env.VITE_USE_AUTH_MOCK || "").toLowerCase() === "true";

export const classroomApi = {
  // GET /classrooms - משיכת כל הכיתות שהמשתמש מורשה לראות
  getClassrooms: async () => {
    if (useMock) {
      return [
        { id: "301", examName: "מבוא למדעי המחשב", status: "active", supervisor: "ישראל ישראלי", floor: 3 },
        { id: "302", examName: "אלגוריתמים", status: "warning", supervisor: null, floor: 3 },
        { id: "404", examName: "מבוא למדעי המחשב", status: "active", supervisor: "שרה כהן", floor: 4 },
      ];
    }
    return apiFetch('/classrooms');
  },

  // PATCH /classrooms/:id/assign - הקצאת משגיח
  assignSupervisor: async (classroomId, supervisorId) => {
    if (useMock) return { success: true };
    return apiFetch(`/classrooms/${classroomId}/assign`, {
      method: "PATCH",
      body: { supervisor_id: supervisorId }
    });
  }
};