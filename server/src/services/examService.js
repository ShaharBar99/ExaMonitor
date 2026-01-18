import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AuditTrailService } from './auditTrailService.js';

export const ExamService = {
  // GET /exams?status=active
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


  // GET /exams/:id
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

  // POST /exams
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

  // PATCH /exams/:id/status
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
        .eq('exam_id', examId)
        .eq('supervisor_id', userId); // רק חדרים ללא משגיח מוקצה

      if (roomsErr) throw roomsErr;

      const roomIds = classrooms.map(r => r.id);

      if (roomIds.length > 0) {
        // שלב ב': עדכון כל הסטודנטים בחדרים האלו שנמצאים בסטטוס פעיל
        const { error: attError } = await supabaseAdmin
          .from('attendance')
          .update({ 
            status: 'submitted', 
            check_out_time: new Date().toISOString()
          })
          .in('classroom_id', roomIds) // שימוש ב-classroom_id במקום exam_id
          .in('status', ['present', 'exited_temporarily']);

        if (attError) console.error("Error auto-submitting students:", attError);
      }

      // 3. יצירת הדוח - הוספתי await כדי להבטיח שהדוח ייווצר רק אחרי שהסטודנטים עודכנו
      report = await this.finalizeAndSaveReport(examId, userId, classrooms[0]?.id); // שימוש ב-classroom_id
    }

    return { exam: examData, report };
  },


  // כנראה שמתי פה בטעות
  // //tk added
  // async countBreaksByExam(examId) {
  //   const { count, error } = await supabaseAdmin
  //     .from('student_breaks')
  //     .select('id, attendance:attendance_id!inner(classrooms:classroom_id!inner(exam_id))', {
  //       count: 'exact',
  //       head: true,
  //     })
  //     .eq('attendance.classrooms.exam_id', examId);

  //   if (error) throw error;
  //   return count || 0;
  // },


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
  // PATCH /exams/:id/extra-time  (adds minutes)
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
