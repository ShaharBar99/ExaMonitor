import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AuditTrailService } from './auditTrailService.js';

/**
 * Service for managing exams.
 */
export const ExamService = {
  /**
   * Lists exams based on status.
   * @param {string} status - The status to filter by.
   * @returns {Promise<Array>} A list of exams.
   */
  async listExams(status) {
    let query = supabaseAdmin
      .from('exams')
      .select(`
        id,
        course_id,
        original_start_time,
        original_duration,
        extra_time,
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
      `)
      .order('original_start_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data || [];
  },


  /**
   * Lists all courses.
   * @returns {Promise<Array>} List of courses.
   */
  async listAllCourses() {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*');

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }
    return data || [];
  },




  /**
   * Lists lecturers for a specific course.
   * @param {string} courseId - The course ID.
   * @returns {Promise<Array>} List of lecturers.
   */
  async listCourseLecturers(courseId) {
    const { data, error } = await supabaseAdmin
      .from('course_lecturers')
      .select(`
      lecturer_id,
      profiles:lecturer_id (
        id,
        full_name,
        email
      )
    `)
      .eq('course_id', courseId);

    if (error) throw Object.assign(new Error(error.message), { status: 400 });
    return (data || []).map(r => r.profiles).filter(Boolean);
  },




  //added for new tables
  /**
   * Lists lecturers assigned to a specific exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<Array>} List of lecturers.
   */
  async listExamLecturers(examId) {
    const { data, error } = await supabaseAdmin
      .from('exam_lecturers')
      .select(`
        lecturer_id,
        profiles:lecturer_id (
          id,
          full_name,
          email
        )
      `)
      .eq('exam_id', examId);

    if (error) throw Object.assign(new Error(error.message), { status: 400 });
    return (data || []).map(r => r.profiles).filter(Boolean);
  },

  /**
   * Adds a lecturer to an exam.
   * @param {string} examId - The exam ID.
   * @param {string} lecturerId - The lecturer ID.
   * @returns {Promise<object>} The created assignment.
   */
  async addExamLecturer(examId, lecturerId) {
    // prevent duplicates (since DB has no unique constraint on exam_id+lecturer_id)
    const { data: existing } = await supabaseAdmin
      .from('exam_lecturers')
      .select('id')
      .eq('exam_id', examId)
      .eq('lecturer_id', lecturerId)
      .maybeSingle();

    if (existing?.id) return existing;

    const { data, error } = await supabaseAdmin
      .from('exam_lecturers')
      .insert([{ exam_id: examId, lecturer_id: lecturerId }])
      .select('*')
      .single();

    if (error) throw Object.assign(new Error(error.message), { status: 400 });
    return data;
  },

  /**
   * Removes a lecturer from an exam.
   * @param {string} examId - The exam ID.
   * @param {string} lecturerId - The lecturer ID.
   * @returns {Promise<{deleted: boolean}>} Result.
   */
  async removeExamLecturer(examId, lecturerId) {
    const { error } = await supabaseAdmin
      .from('exam_lecturers')
      .delete()
      .eq('exam_id', examId)
      .eq('lecturer_id', lecturerId);

    if (error) throw Object.assign(new Error(error.message), { status: 400 });
    return { deleted: true };
  },

  /**
   * Lists exams assigned to a specific lecturer.
   * @param {string} lecturerId - The lecturer ID.
   * @returns {Promise<Array>} List of exams.
   */
  async listExamsByLecturer(lecturerId) {
    const { data, error } = await supabaseAdmin
      .from('exam_lecturers')
      .select(`
        exam_id,
        exams:exam_id (
          id,
          course_id,
          original_start_time,
          original_duration,
          extra_time,
          status,
          courses:course_id (
            id,
            course_name,
            course_code
          )
        )
      `)
      .eq('lecturer_id', lecturerId);

    if (error) throw Object.assign(new Error(error.message), { status: 400 });
    return (data || []).map(r => r.exams).filter(Boolean);
  },

  /**
   * Gets available lecturers for an exam (not yet assigned).
   * @param {string} examId - The exam ID.
   * @returns {Promise<Array>} List of available lecturers.
   */
  async getAvailableExamLecturers(examId) {
    // 1. Get Exam -> Course details (including main lecturer)
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select(`
        course_id,
        courses (
          id,
          lecturer_id
        )
      `)
      .eq('id', examId)
      .single();

    if (examError || !exam || !exam.courses) {
      throw new Error("Exam or Course not found");
    }

    const courseId = exam.course_id;
    const mainLecturerId = exam.courses.lecturer_id;

    // 2. Get Course Lecturers (from course_lecturers table)
    const { data: courseLecturers, error: clError } = await supabaseAdmin
      .from('course_lecturers')
      .select('lecturer_id')
      .eq('course_id', courseId);

    if (clError) throw new Error(clError.message);

    // 3. Get Lecturers ALREADY in this exam (to exclude)
    const { data: assigned, error: assignError } = await supabaseAdmin
      .from('exam_lecturers')
      .select('lecturer_id')
      .eq('exam_id', examId);

    if (assignError) throw new Error(assignError.message);

    // 4. Calculate final list of allowed lecturer IDs
    const allowedIds = new Set();
    if (mainLecturerId) allowedIds.add(mainLecturerId);
    (courseLecturers || []).forEach(cl => allowedIds.add(cl.lecturer_id));

    const assignedIds = new Set((assigned || []).map(r => r.lecturer_id));

    // Filter out already assigned
    const finalIds = [...allowedIds].filter(id => !assignedIds.has(id));

    if (finalIds.length === 0) return [];

    // 5. Fetch profiles
    const { data: profiles, error: pError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', finalIds);

    if (pError) throw new Error(pError.message);

    return profiles || [];
  },



  /**
   * Gets an exam by ID.
   * @param {string} examId - The exam ID.
   * @returns {Promise<object>} The exam details.
   */
  async getExamById(examId) {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .select(`
        id,
        course_id,
        original_start_time,
        original_duration,
        extra_time,
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
      `)
      .eq('id', examId)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 404;
      throw err;
    }

    return data;
  },

  /**
   * Creates a new exam.
   * @param {object} examData - Exam data.
   * @param {string} examData.course_code - Course code.
   * @param {string} examData.original_start_time - Start time.
   * @returns {Promise<object>} The created exam.
   */
  async createExam({ course_code, original_start_time, original_duration }) {
    // First, look up the course by course_code to get the course_id (uuid)
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('course_code', course_code)
      .single();

    if (courseError || !course) {
      const err = new Error(`Course with code '${course_code}' not found`);
      err.status = 400;
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert([
        {
          course_id: course.id, // Use the course uuid
          original_start_time,
          original_duration,
          extra_time: 0,
          status: 'pending',
        },
      ])
      .select(`
        id,
        course_id,
        original_start_time,
        original_duration,
        extra_time,
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
      `)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data;
  },

  /**
   * Updates the status of an exam.
   * @param {string} examId - The exam ID.
   * @param {string} status - The new status.
   * @param {string} userId - The ID of the user performing the update.
   * @returns {Promise<{exam: object, report: object}>} The updated exam and optional report.
   */
  async updateStatus(examId, status, userId) {
    // 1. עדכון המבחן עצמו
    const { data: examData, error: examError } = await supabaseAdmin
      .from('exams')
      .update({ status })
      .eq('id', examId)
      .select(`*, courses:course_id (course_name, course_code)`)
      .single();

    if (examError) throw examError;

    let report = null;

    // 2. אם המבחן הסתיים - נבצע Force Submit לכולם
    if (status === 'finished') {
      // שלב א': מציאת כל החדרים ששייכים למבחן הזה
      const { data: classrooms, error: roomsErr } = await supabaseAdmin
        .from('classrooms')
        .select('id')
        .eq('exam_id', examId);

      if (roomsErr) throw roomsErr;

      const roomIds = classrooms.map(r => r.id);

      if (roomIds.length > 0) {
        const now = new Date().toISOString();

        // Find and close all open breaks for students in these classrooms
        const { data: studentsOnBreak, error: breakFetchErr } = await supabaseAdmin
          .from('attendance')
          .select('id')
          .in('classroom_id', roomIds)
          .eq('status', 'exited_temporarily');

        if (breakFetchErr) {
          console.error("Error fetching students on break:", breakFetchErr);
        } else if (studentsOnBreak && studentsOnBreak.length > 0) {
          const attendanceIdsOnBreak = studentsOnBreak.map(a => a.id);

          const { error: breakUpdateErr } = await supabaseAdmin
            .from('student_breaks')
            .update({ return_time: now })
            .in('attendance_id', attendanceIdsOnBreak)
            .is('return_time', null);

          if (breakUpdateErr) {
            console.error("Error closing open breaks:", breakUpdateErr);
          }
        }

        // שלב ב': עדכון כל הסטודנטים בחדרים האלו שנמצאים בסטטוס פעיל
        const { error: attError } = await supabaseAdmin
          .from('attendance')
          .update({
            status: 'submitted',
            check_out_time: now
          })
          .in('classroom_id', roomIds) // שימוש ב-classroom_id במקום exam_id
          .in('status', ['present', 'exited_temporarily']);

        if (attError) console.error("Error auto-submitting students:", attError);
      }

      // 3. יצירת הדוח - הוספתי await כדי להבטיח שהדוח ייווצר רק אחרי שהסטודנטים עודכנו
      if (classrooms && classrooms.length > 0) {
        report = await this.finalizeAndSaveReport(examId, userId, classrooms[0]?.id); // שימוש ב-classroom_id
      }
    }

    return { exam: examData, report };
  },


  /**
   * Helper to find the student with the most exits.
   * @param {Array} breaksData - Array of break records.
   * @returns {object|null} The student with most exits.
   */
  getStudentWithMostExits(breaksData) {
    if (!breaksData || breaksData.length === 0) return null;

    const exitCounts = {};
    breaksData.forEach(b => {
      const studentName = b.attendance?.profiles?.full_name || "סטודנט לא ידוע";
      exitCounts[studentName] = (exitCounts[studentName] || 0) + 1;
    });

    const topName = Object.keys(exitCounts).reduce((a, b) =>
      exitCounts[a] > exitCounts[b] ? a : b
    );

    return {
      name: topName,
      count: exitCounts[topName]
    };
  },

  /**
   * Finalizes and saves the exam report.
   * @param {string} examId - The exam ID.
   * @param {string} userId - The user ID.
   * @param {string} classroomId - The classroom ID.
   * @returns {Promise<object>} The saved report.
   */
  async finalizeAndSaveReport(examId, userId, classroomId) {
    // 1. נפיק נתונים *רק* עבור הכיתה הספציפית הזו
    const reportData = await this.getClassroomReport(classroomId);

    // 2. שמירה בטבלת exam_reports - אבל הפעם לפי classroom_id
    const { data, error } = await supabaseAdmin
      .from('exam_reports')
      .upsert({
        exam_id: examId,
        classroom_id: classroomId, // חייב להוסיף את העמודה הזו ב-DB
        generated_by: userId,
        summary_stats: reportData,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'classroom_id' // המפתח לייחודיות הוא הכיתה, לא המבחן!
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  /**
   * Generates a report for a specific classroom.
   * @param {string} classroomId - The classroom ID.
   * @returns {Promise<object>} The report data.
   */
  async getClassroomReport(classroomId) {
    console.log(`[DEBUG] Fetching classroom report for ID: ${classroomId}`);

    const [attendance, incidents, breaks] = await Promise.all([
      // 1. כל הסטודנטים שרשומים לחדר הזה
      supabaseAdmin
        .from('attendance')
        .select('status')
        .eq('classroom_id', classroomId),

      // 2. כל האירועים החריגים שנרשמו בחדר הזה
      // הנחה: יש לך עמודת classroom_id בטבלת exam_incidents
      supabaseAdmin
        .from('exam_incidents')
        .select('*')
        .eq('classroom_id', classroomId),

      // 3. כל ההפסקות של הסטודנטים בחדר הזה
      supabaseAdmin
        .from('student_breaks')
        .select('*, attendance!inner(classroom_id, profiles(full_name))')
        .eq('attendance.classroom_id', classroomId)
    ]);

    const attData = attendance?.data || [];
    const incData = incidents?.data || [];
    const brkData = breaks?.data || [];

    // חישוב זמני הפסקות (בדקות)
    let totalBreakMinutes = 0;
    brkData.forEach(b => {
      if (b.return_time && b.exit_time) {
        const duration = (new Date(b.return_time) - new Date(b.exit_time)) / 60000;
        totalBreakMinutes += duration;
      }
    });

    const avgBreak = brkData.length > 0
      ? (totalBreakMinutes / brkData.length).toFixed(1)
      : "0.0";

    // מציאת הסטודנט שיצא הכי הרבה פעמים בחדר הזה
    const mostExits = this.getStudentWithMostExits(brkData);

    return {
      generatedAt: new Date().toISOString(),
      classroomId: classroomId,
      summary: {
        totalStudents: attData.length,
        submitted: attData.filter(a => ['submitted', 'finished'].includes(a.status)).length,
        absent: attData.filter(a => a.status === 'absent').length,
        currentlyInRoom: attData.filter(a => a.status === 'present').length,
        currentlyInBreak: attData.filter(a => a.status === 'exited_temporarily').length
      },
      breaks: {
        totalCount: brkData.length,
        averageMinutes: avgBreak,
        mostExits: mostExits
      },
      incidents: {
        total: incData.length,
        highSeverity: incData.filter(i => i.severity === 'high').length,
        types: incData.reduce((acc, curr) => {
          acc[curr.incident_type] = (acc[curr.incident_type] || 0) + 1;
          return acc;
        }, {})
      }
    };
  },
  /**
   * Adds extra time to an exam.
   * @param {string} examId - The exam ID.
   * @param {number} additionalMinutes - Minutes to add.
   * @returns {Promise<object>} The updated exam.
   */
  async addExtraTime(examId, additionalMinutes) {
    // read current extra_time first
    const { data: current, error: readErr } = await supabaseAdmin
      .from('exams')
      .select('extra_time')
      .eq('id', examId)
      .single();

    if (readErr) {
      const err = new Error(readErr.message);
      err.status = 404;
      throw err;
    }

    const newExtra = (current.extra_time || 0) + additionalMinutes;

    const { data, error } = await supabaseAdmin
      .from('exams')
      .update({ extra_time: newExtra })
      .eq('id', examId)
      .select(`
        id,
        course_id,
        original_start_time,
        original_duration,
        extra_time,
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
      `)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data;
  },

  /**
   * Broadcasts an announcement.
   * @param {string} examId - The exam ID.
   * @param {string} message - The message.
   * @param {string} userId - The user ID.
   * @returns {Promise<{success: boolean}>} Result.
   */
  async broadcastAnnouncement(examId, message, userId) {
    console.log(`Broadcasting announcement for exam ${examId}: ${message}`);

    await AuditTrailService.log({
      userId: userId,
      action: 'exam.broadcast',
      metadata: {
        examId: examId,
        message: message,
      },
    });

    return { success: true };
  },
  /**
   * Gets timing information for an exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<object>} Timing data.
   */
  async getExamTiming(examId) {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .select('original_start_time, original_duration, extra_time') // הוספנו גם זמן הארכה
      .eq('id', examId)
      .single();

    if (error) {
      console.error("Error fetching timing:", error);
      throw error;
    }
    console.log("Fetched timing data:", data);
    // חשוב: ה-Frontend מצפה לשמות שדות ב-camelCase
    return {
      startTime: data.original_start_time,
      originalDuration: data.original_duration,
      extraTime: data.extra_time || 0
    };
  }






};
