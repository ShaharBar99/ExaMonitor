import { examsApi } from '../api/examsApi';
import { classroomApi } from '../api/classroomApi';

/**
 * Handlers for exam management logic, including fetching, filtering, and status updates.
 */
export const examHandlers = {
    /**
     * Fetches a list of exams from the server.
     * @param {string} [status='all'] - Filter exams by status ('active', 'pending', 'finished', 'all').
     * @returns {Promise<Array>} A promise that resolves to an array of exam objects.
     */
    fetchExams: async (status = 'all') => {
        try {
            const exams = await examsApi.listExams(status);
            return exams || [];
        } catch (error) {
            console.error("Error fetching exams:", error);
            throw error;
        }
    },

    /**
     * Fetches exams along with their associated classrooms.
     * Supports filtering by status, supervisor, or lecturer.
     *
     * @param {string} [status='all'] - Filter by exam status.
     * @param {string} [supervisorId=null] - Filter classrooms assigned to a specific supervisor.
     * @param {string} [lecturerId=null] - Filter exams assigned to a specific lecturer.
     * @returns {Promise<Array>} A promise that resolves to an array of exams with a 'classrooms' property.
     */
    fetchExamsWithClassrooms: async (status = 'all', supervisorId = null, lecturerId = null) => {
        try {
            let exams;
            let classrooms = await classroomApi.getClassrooms();

            if (lecturerId) {
                // Use the exam_lecturers table to get exams assigned to this lecturer
                exams = await examsApi.listExamsByLecturer(lecturerId);
            } else {
                exams = await examsApi.listExams(status);
            }

            // אם יש supervisor_id, סנן קודם את החדרים שהוקצו לעובד הפרטי הזה
            if (supervisorId) {
                classrooms = classrooms.filter(room => room.supervisor_id === supervisorId);

                // אז סנן את המבחנים כדי להראות רק את אלו שיש להם חדרים שהוקצו למשגיח הזה
                const assignedExamIds = new Set(classrooms.map(room => room.exam_id));
                exams = exams.filter(exam => assignedExamIds.has(exam.id));
            }

            // צירוף חדרים לפי exam_id בדיוק

            const examsWithClassrooms = exams.map(exam => ({
                ...exam,
                classrooms: classrooms.filter(room => room.exam_id === exam.id)
            }));
            return examsWithClassrooms || [];
        } catch (error) {
            console.error("Error fetching exams with classrooms:", error);
            alert("שגיאה בטעינת המבחנים עם הכיתות.");
        }
    },

    /**
     * Fetches a specific exam by its ID.
     * @param {string} examId - The ID of the exam to fetch.
     * @returns {Promise<object>} A promise that resolves to the exam object.
     */
    getExam: async (examId) => {
        try {
            const exam = await examsApi.getExamById(examId);
            return exam;
        } catch (error) {
            console.error("Error fetching exam:", error);
            throw error;
        }
    },

    /**
     * Fetches available lecturers that can be assigned to a specific exam.
     * @param {string} examId - The ID of the exam.
     * @returns {Promise<{ok: boolean, data?: {lecturers: Array}, message?: string}>} The result object.
     */
    fetchAvailableExamLecturers: async (examId) => {
        try {
            if (!examId) throw new Error("Missing exam ID");
            const res = await examsApi.getAvailableExamLecturers(examId);
            return { ok: true, data: { lecturers: res } };
        } catch (err) {
            console.error("Error fetching available lecturers:", err);
            return { ok: false, message: err.message };
        }
    },

    /**
     * Filters a list of exams based on a search query.
     * Matches against course name, exam ID, or room number.
     *
     * @param {Array} exams - The list of exams to filter.
     * @param {string} query - The search query.
     * @returns {Array} The filtered list of exams.
     */
    filterExams: (exams, query) => {
        try {
            if (!Array.isArray(exams)) return [];
            if (!query || typeof query !== 'string') return exams;

            const lowerQuery = query.toLowerCase();

            return exams.filter(exam => {
                return (
                    exam.courseName?.toLowerCase().includes(lowerQuery) ||
                    exam.id?.toString().includes(lowerQuery) ||
                    exam.room?.toLowerCase().includes(lowerQuery)
                );
            });
        } catch (error) {
            console.error("Error filtering exams:", error);
            return [];
        }
    },

    /**
     * Handles the selection of an exam and navigates to the exam console.
     * @param {string} examId - The ID of the selected exam.
     * @param {Function} navigate - The navigation function (e.g., from react-router).
     */
    handleSelectExam: (examId, navigate) => {
        try {
            if (!examId || !navigate) throw new Error("Missing parameters for navigation");
            console.log(`Navigating to exam: ${examId}`);
            navigate(`/exam-console/${examId}`);
        } catch (error) {
            console.error("Navigation failed:", error);
            alert("חלה שגיאה במעבר לדף המבחן.");
        }
    },

    /**
     * Sends a broadcast message to all classrooms associated with an exam.
     * Prompts the user for the message content.
     * @param {string} examId - The ID of the exam.
     */
    handleBroadcast: async (examId) => {
        try {
            const message = prompt("הקלד את ההודעה להפצה לכל הכיתות:");
            if (!message || !message.trim()) return;

            const response = await examsApi.broadcastAnnouncement(examId, message);
            if (response.success) {
                alert("ההודעה הופצה בהצלחה לכל המשגיחים והסטודנטים.");
            }
        } catch (error) {
            console.error("Broadcast failed:", error);
            alert("שגיאה בהפצת ההודעה.");
        }
    },

    /**
     * Changes the status of an exam (e.g., active, paused, finished).
     * Includes a confirmation dialog.
     *
     * @param {string} examId - The ID of the exam.
     * @param {string} newStatus - The new status to set.
     * @param {Function} [setExamData] - Optional state setter to update local state.
     * @param {string} [userId] - The ID of the user performing the action.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    handleChangeStatus: async (examId, newStatus, setExamData, userId) => {
        try {
            // 1. הודעת אישור מותאמת אישית יותר
            const statusNames = {
                'active': 'פעיל',
                'paused': 'מוקפא',
                'finished': 'סיום'
            };

            const confirmMsg = newStatus === 'finished'
                ? "האם אתה בטוח שברצונך לסיים את המבחן? לא ניתן לבטל פעולה זו."
                : `האם לשנות את סטטוס המבחן ל-${statusNames[newStatus] || newStatus}?`;

            if (!window.confirm(confirmMsg)) return false;
            const response = await examsApi.updateExamStatus(examId, newStatus, userId);
            console.log("Status update response:", response);
            if (response) {
                // עדכון ה-State המקומי רק אם הפונקציה קיימת
                if (typeof setExamData === 'function') {
                    setExamData(prev => ({
                        ...prev,
                        status: newStatus,
                        startTime: (newStatus === 'active' && !prev.startTime) ? new Date().toISOString() : prev.startTime
                    }));
                }

                console.log(`Status updated to: ${newStatus}`);
                return true;
            } else {
                throw new Error(response?.message || "השרת החזיר תשובה שלילית");
            }

        } catch (error) {
            console.error("Status update failed:", error);
            alert("עדכון הסטטוס נכשל: " + (error.message || "שגיאת תקשורת"));
            return false;
        }

    },

    /**
     * Adds extra time to an exam globally.
     * @param {string} examId - The ID of the exam.
     * @param {Function} setExamData - State setter to update local exam data.
     */
    handleAddExtraTime: async (examId, setExamData) => {
        try {
            const additionalMinutes = 15; // ברירת מחדל
            if (!window.confirm(`האם להוסיף ${additionalMinutes} דקות לכל הסטודנטים במבחן?`)) return;

            const updatedExam = await examsApi.addExtraTime(examId, additionalMinutes);

            if (updatedExam) {
                setExamData(prev => ({
                    ...prev,
                    extra_time: updatedExam.extra_time
                }));
                alert(`נוספו ${additionalMinutes}  דקות בהצלחה, המתן כ-10 שניות לאחר האישור`);
            }
        } catch (error) {
            console.error("Failed to add extra time:", error);
            alert("נכשל בעדכון זמן ההארכה");
        }
    },


    //added for new tables
    /**
     * Loads lecturers associated with a course.
     * @param {string} courseId - The ID of the course.
     * @returns {Promise<Array>} List of lecturers.
     */
    loadCourseLecturers: async (courseId) => {
        const res = await examsApi.getCourseLecturers(courseId);
        return res?.lecturers || [];
    },

    /**
     * Loads lecturers assigned to a specific exam.
     * @param {string} examId - The ID of the exam.
     * @returns {Promise<Array>} List of lecturers (profiles).
     */
    loadExamLecturers: async (examId) => {
        const res = await examsApi.getExamLecturers(examId);
        return res?.lecturers || []; // Now returns array of profiles
    },

    /**
     * Adds a substitute lecturer to an exam.
     * @param {string} examId - The ID of the exam.
     * @param {string} lecturerId - The ID of the lecturer to add.
     */
    handleAddSubstituteLecturer: async (examId, lecturerId) => {
        await examsApi.addExamLecturer(examId, lecturerId);
    },

    /**
     * Removes a substitute lecturer from an exam.
     * @param {string} examId - The ID of the exam.
     * @param {string} lecturerId - The ID of the lecturer to remove.
     */
    handleRemoveSubstituteLecturer: async (examId, lecturerId) => {
        await examsApi.removeExamLecturer(examId, lecturerId);
    },

};