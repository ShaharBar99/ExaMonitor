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
    fetchExamsWithClassrooms: async (status = 'all', supervisorId = null,lecturerId = null) => {
        try {
            let exams = await examsApi.listExams(status);
            let classrooms = await classroomApi.getClassrooms();
            let courses = [];
            if (lecturerId!==null) courses = await examsApi.listCourses();
            console.log('Fetched exams:', exams);
            // אם יש supervisor_id, סנן קודם את החדרים שהוקצו לעובד הפרטי הזה
            if (supervisorId) {
                classrooms = classrooms.filter(room => room.supervisor_id === supervisorId);
                
                // אז סנן את המבחנים כדי להראות רק את אלו שיש להם חדרים שהוקצו למשגיח הזה
                const assignedExamIds = new Set(classrooms.map(room => room.exam_id));
                exams = exams.filter(exam => assignedExamIds.has(exam.id));
            }
            if(lecturerId){
                // אז סנן את המבחנים כדי להראות רק את אלו שיש להם חדרים שהוקצו למרצה הזה
                courses = courses.filter(course => course.lecturer_id === lecturerId);
                const assignedCourseIds = new Set(courses.map(course => course.id));
                exams = exams.filter(exam => assignedCourseIds.has(exam.course_id));
            }
             // צירוף חדרים לפי exam_id בדיוק
           
            const examsWithClassrooms = exams.map(exam => ({
                ...exam,
                classrooms: classrooms.filter(room => room.exam_id === exam.id)
            }));
            
            return examsWithClassrooms || [];
        } catch (error) {
            console.error("Error fetching exams with classrooms:", error);
            throw error;
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

    }
};