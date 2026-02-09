import { classroomApi } from '../api/classroomApi';
import { attendanceApi } from '../api/attendanceApi';
import * as classroomsApiDefault from "../api/classroomsApi";

export const classroomHandler = {
  /**
   * Loads and filters classroom data based on user roles.
   * @param {string} userRole - 'lecturer', 'floor_supervisor', etc.
   * @param {string} courseName - The name of the course (for lecturer filtering).
   * @param {Function} setClassrooms - State setter for classrooms.
   * @param {Function} setLoading - State setter for loading status.
   */
  loadDisplayData: async (userRole, examId = null, courseName = null, setClassrooms, setLoading = () => {}, lecturerId = null) => {
    try {
      setLoading(true);
      // If we have an examId, request server-side filtered classrooms for that exam
      const data = lecturerId ? await classroomApi.getClassrooms(examId, lecturerId) : await classroomApi.getClassrooms(examId);
      const enrichedData = await Promise.all(data.map(async (room) => {
          const students = await attendanceApi.getStudentsForSupervisor(room.exam_id, room.supervisor_id);
          const actualArray = Array.isArray(students) ? students : (students?.data || []);
          return {
              ...room,
              studentsCount: actualArray.length,
              submittedCount: actualArray.filter(s => s.status === 'submitted').length,
          };
      }));
      if (userRole === 'lecturer') {
        // If backend returned filtered data (examId provided) just use it
        if (examId || lecturerId) {
          setClassrooms(enrichedData);
        } else if (courseName) {
          // Fallback: filter by course name matching the room's examName
          const lecturerRooms = enrichedData.filter(room => String(room.examName || '').toLowerCase().includes(String(courseName || '').toLowerCase()));
          setClassrooms(lecturerRooms);
        } else {
          setClassrooms([]);
        }
      } else {
        // Supervisors see all rooms they are authorized for
        setClassrooms(enrichedData);
      }
    } catch (error) {
      console.error("Failed to load classrooms:", error);
      // Optional: Set an empty array or handle error state
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  },
  getClassrooms: async(examId)=>{
    try{
    return await classroomApi.getClassrooms(examId);
    }
    catch(err){
      console.error("Failed to fetch classrooms",err);
    }
  },

  /**
   * Handles the assignment of a supervisor to a classroom.
   * @param {string|number} classroomId 
   * @param {string|number} supervisorId 
   * @param {Function} onSuccess - Callback to refresh data or notify UI.
   */
  handleAssign: async (classroomId, supervisorId, onSuccess) => {
    try {
      const response = await classroomApi.assignSupervisor(classroomId, supervisorId);
      
      if (response && (response.success || !response.error)) {
        if (onSuccess) onSuccess();
      } else {
        alert("שגיאה בשיבוץ המשגיח");
      }
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("פעולת השיבוץ נכשלה ברמת השרת");
    }
  },

  /**
   * Loads the list of available supervisors for assignment.
   * @returns {Promise<Array>} Array of supervisor objects with id and name.
   */
  loadSupervisors: async () => {
    try {
      const supervisors = await classroomApi.getSupervisors();
      return supervisors;
    } catch (error) {
      console.error("Failed to load supervisors:", error);
      return []; // Return empty array on error
    }
  }
};

// Admin Handlers for classroom management
export async function fetchClassrooms(filters = {}, deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  const data = await classroomsApi.listClassrooms(filters);
  const classrooms = data?.classrooms || [];
  console.log("fetchClassrooms: retrieved", classrooms.length, "classrooms");
  return { ok: true, data: { classrooms } };
}

export async function createNewClassroom(classroomData, deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  if (!classroomData.exam_id || !classroomData.room_number) {
    throw new Error("exam_id and room_number are required");
  }

  const data = await classroomsApi.createClassroom(classroomData);
  return { ok: true, data };
}

export async function updateClassroomDetails(classroomId, classroomData, deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  const data = await classroomsApi.updateClassroom(classroomId, classroomData);
  return { ok: true, data };
}

export async function deleteClassroomHandler(classroomId, deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  const data = await classroomsApi.deleteClassroom(classroomId);
  return { ok: true, data };
}

export async function assignSupervisorsHandler(classroomId, assignmentData, deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  const data = await classroomsApi.assignSupervisorsToClassroom(classroomId, assignmentData);
  return { ok: true, data };
}

export async function getClassroomHandler(classroomId, deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  const data = await classroomsApi.getClassroomById(classroomId);
  return { ok: true, data };
}

export async function fetchSupervisors(deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  const data = await classroomsApi.getSupervisors();
  const supervisors = data?.supervisors || [];
  return { ok: true, data: { supervisors } };
}

export function filterClassrooms(classrooms, filters = {}) {
  const list = Array.isArray(classrooms) ? classrooms : [];
  const q = String(filters.search || "").trim().toLowerCase();
  const examId = filters.exam_id;

  return list.filter((c) => {
    const room = String(c?.room_number || "").toLowerCase();
    const examMatch = !examId || c?.exam_id === examId;
    const searchMatch = !q || room.includes(q);

    return examMatch && searchMatch;
  });
}

export async function importClassroomsFromExcel(formData, deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  const data = await classroomsApi.importClassrooms(formData);
  return { ok: true, data };
}

export async function fetchExamsForAssignment(filters = {}, deps = {}) {
  const classroomsApi = deps.classroomsApi || classroomsApiDefault;
  
  const data = await classroomsApi.listExams(filters);
  const exams = data?.items || data?.exams || [];
  return { ok: true, data: { exams } };
}