import { supabaseAdmin } from '../lib/supabaseClient.js';

const ALLOWED_STATUS = new Set(['present', 'absent', 'exited_temporarily', 'submitted']);

export const AttendanceService = {
  
  async getStudentsForSupervisor(examId, supervisorId) {
    // 1. מציאת החדר הספציפי שהמשגיח הזה משובץ אליו עבור המבחן הזה
    const { data: classrooms, error: roomErr } = await supabaseAdmin
      .from('classrooms')
      .select('id')
      .eq('exam_id', examId)
      .eq('supervisor_id', supervisorId);

    if (roomErr || !classrooms || classrooms.length === 0) {
      console.error("No classroom found for this supervisor in this exam");
      return [];
    }

    // Take the first classroom (assuming supervisor manages one classroom per exam)
    const classroom = classrooms[0];

    // 2. שליפת הסטודנטים רק עבור החדר הזה
    const { data: students, error: attErr } = await supabaseAdmin
      .from('attendance')
      .select(`
        id, status,
        profiles:student_id (full_name, student_id)
      `)
      .eq('classroom_id', classroom.id);

    if (attErr) throw attErr;

    return students.map(s => ({
      id: s.id, // attendanceId as id
      studentId: s.profiles?.student_id,
      name: s.profiles?.full_name,
      status: s.status,
      classroomId: classroom.id // עכשיו אנחנו יודעים בוודאות באיזה חדר אנחנו
    }));
  },

  /**
   * עדכון סטטוס סטודנט בטבלת attendance
   */
  async updateStudentStatus(attendanceId, status) {
    if (!ALLOWED_STATUS.has(status)) {
      throw new Error('Invalid status value');
    }

    const updateData = { status };
    if (status === 'submitted') {
      updateData.check_out_time = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update(updateData)
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  /**
   * יציאה לשירותים - יצירת שורה ב-student_breaks ועדכון סטטוס ב-attendance
   */
  async startBreak({ attendanceId, reason = 'toilet' }) {
    const now = new Date().toISOString();
    console.log("Starting break for attendance ID:", attendanceId, "with reason:", reason);
    // 1. יצירת רשומת הפסקה
    const { data: brk, error: breakErr } = await supabaseAdmin
      .from('student_breaks')
      .insert([{ 
        attendance_id: attendanceId, 
        exit_time: now, 
        reason: reason 
      }])
      .select()
      .single();
    if (breakErr) throw breakErr;

    // 2. עדכון סטטוס נוכחות ל"יצא זמנית"
    const { data: att, error: attErr } = await supabaseAdmin
      .from('attendance')
      .update({ status: 'exited_temporarily' })
      .eq('id', attendanceId)
      .select()
      .single();
    if (attErr) throw attErr;

    return { success: true, break: brk, attendance: att };
  },

  /**
   * חזרה מהפסקה - סגירת רשומת ה-break והחזרת הסטטוס ל-present
   */
  async endBreak({ attendanceId }) {
    const now = new Date().toISOString();

    // 1. עדכון זמן חזרה ברשומה הפתוחה האחרונה
    const { data: brk, error: breakErr } = await supabaseAdmin
      .from('student_breaks')
      .update({ return_time: now })
      .eq('attendance_id', attendanceId)
      .is('return_time', null)
      .select()
      .single();

    if (breakErr) throw breakErr;

    // 2. החזרת סטטוס הנוכחות ל"נוכח"
    const { data: att, error: attErr } = await supabaseAdmin
      .from('attendance')
      .update({ status: 'present' })
      .eq('id', attendanceId)
      .select()
      .single();

    if (attErr) throw attErr;

    return { success: true, break: brk, attendance: att };
  },

  /**
   * סיכום סטטיסטי לקומה (עבור מנהל קומה)
   */
  async getFloorSummary(floorId) {
    // שלב א': משיכת כל החדרים בקומה
    const { data: rooms, error: roomErr } = await supabaseAdmin
      .from('classrooms')
      .select('id')
      .eq('floor_supervisor_id', floorId); // או סינון לפי קומה אם יש שדה floor

    if (roomErr) throw roomErr;
    const roomIds = rooms.map(r => r.id);

    // שלב ב': משיכת נתוני נוכחות לחדרים אלו
    const { data: attendance, error: attErr } = await supabaseAdmin
      .from('attendance')
      .select('status')
      .in('classroom_id', roomIds);

    if (attErr) throw attErr;

    return {
      totalStudents: attendance.length,
      active: attendance.filter(s => s.status === 'present').length,
      submitted: attendance.filter(s => s.status === 'submitted').length,
      inRestroom: attendance.filter(s => s.status === 'exited_temporarily').length,
      urgentIncidents: 0 // ניתן להוסיף שאילתה לטבלת incidents כאן
    };
  },

  /**
   * שיבוץ משגיח לחדר
   */
  async assignSupervisor(classroomId, supervisorId) {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .update({ supervisor_id: supervisorId })
      .eq('id', classroomId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  }
};