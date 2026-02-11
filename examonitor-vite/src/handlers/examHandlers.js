import { examsApi } from '../api/examsApi';
import { classroomApi } from '../api/classroomApi';

export const examHandlers = {
    // טעינת רשימת מבחנים מהשרת
    fetchExams: async (status = 'all') => {
        try {
            const exams = await examsApi.listExams(status);
            return exams || [];
        } catch (error) {
            console.error("Error fetching exams:", error);
            throw error;
        }
    },

    // טעינת מבחנים יחד עם חדרים/כיתות
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

    // טעינת מבחן ספציפי לפי ID
    getExam: async (examId) => {
        try {
            const exam = await examsApi.getExamById(examId);
            return exam;
        } catch (error) {
            console.error("Error fetching exam:", error);
            throw error;
        }
    },

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

    // פונקציית סינון המבחנים לפי טקסט חופשי
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

    // לוגיקת בחירת מבחן ומעבר לדף הבא
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

    // שליחת הודעה גלובלית (Broadcast) לכל הכיתות
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

    // ניהול שינוי סטטוס המבחן (עצירה/חידוש/סיום)
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
    loadCourseLecturers: async (courseId) => {
        const res = await examsApi.getCourseLecturers(courseId);
        return res?.lecturers || [];
    },

    loadExamLecturers: async (examId) => {
        const res = await examsApi.getExamLecturers(examId);
        return res?.lecturers || []; // Now returns array of profiles
    },

    handleAddSubstituteLecturer: async (examId, lecturerId) => {
        await examsApi.addExamLecturer(examId, lecturerId);
    },

    handleRemoveSubstituteLecturer: async (examId, lecturerId) => {
        await examsApi.removeExamLecturer(examId, lecturerId);
    },

};