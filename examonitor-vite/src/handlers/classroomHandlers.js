import { classroomApi } from '../api/classroomApi';

export const classroomHandler = {
  /**
   * Loads and filters classroom data based on user roles.
   * @param {string} userRole - 'lecturer', 'floor_supervisor', etc.
   * @param {string} courseName - The name of the course (for lecturer filtering).
   * @param {Function} setClassrooms - State setter for classrooms.
   * @param {Function} setLoading - State setter for loading status.
   */
  loadDisplayData: async (userRole, courseName, setClassrooms, setLoading = () => {}) => {
    try {
      setLoading(true);
      const data = await classroomApi.getClassrooms();

      if (userRole === 'lecturer') {
        // Filter: Lecturers only see rooms belonging to their specific course
        const lecturerRooms = data.filter(room => room.examName === courseName);
        setClassrooms(lecturerRooms);
      } else {
        // Supervisors see all rooms they are authorized for
        setClassrooms(data);
      }
    } catch (error) {
      console.error("Failed to load classrooms:", error);
      // Optional: Set an empty array or handle error state
      setClassrooms([]);
    } finally {
      setLoading(false);
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