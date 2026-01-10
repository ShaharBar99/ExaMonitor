import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AuditTrailService } from './auditTrailService.js';

const ALLOWED_STATUS = new Set(['present', 'absent', 'exited_temporarily', 'submitted']);

export const AttendanceService = {
  
  async getStudentsForSupervisor(examId, supervisorId) {
    // 1. מציאת החדר הספציפי שהמשגיח הזה משובץ אליו עבור המבחן הזה
    const { data: classrooms, error: roomErr } = await supabaseAdmin
      .from('classrooms')
      .select('id')
      .eq('exam_id', examId)
      .eq('supervisor_id', supervisorId)

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
      .eq('classroom_id', classroom.id)
      .neq('status', 'absent');

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
    // Map Hebrew statuses to English
    
    if (status === 'finished') status = 'submitted';

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
      .select(`
        id, status, student_id, classroom_id,
        profiles:student_id (full_name, student_id),
        classrooms:classroom_id (exam_id, room_number)
      `)
      .single();

    if (error) throw error;

    // Log to audit trail for submission
    if (status === 'submitted') {
      await AuditTrailService.log({
        userId: null, // Could be supervisor, but for now null
        action: 'student.submitted_exam',
        metadata: {
          attendanceId,
          studentId: data.student_id,
          classroomId: data.classroom_id,
          examId: data.classrooms?.exam_id,
          roomNumber: data.classrooms?.room_number,
          studentName: data.profiles?.full_name,
          studentIdNumber: data.profiles?.student_id
        },
      });
    }

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
  },
  /**
 * הוספת סטודנט לחדר מבחן ידנית
 * מוודא שהסטודנט רשום לקורס לפני ההוספה
 */
async addStudentToExam(classroomId, studentProfileId) {
    // 1. מציאת ה-course_id של המבחן המשויך לחדר
    const { data: classroom, error: classErr } = await supabaseAdmin
        .from('classrooms')
        .select('exam_id, exams(course_id)')
        .eq('id', classroomId)
        .single();

    if (classErr) throw classErr;

    // 2. בדיקה שהסטודנט אכן רשום לקורס הזה
    const { data: registration, error: regErr } = await supabaseAdmin
        .from('course_registrations')
        .select('id')
        .eq('student_id', studentProfileId)
        .eq('course_id', classroom.exams.course_id)
        .single();

    if (regErr || !registration) {
        throw new Error("הסטודנט אינו רשום לקורס זה ולכן לא ניתן להוסיפו למבחן");
    }

    // 3. יצירת רשומת נוכחות
    const { data: newAttendance, error: attErr } = await supabaseAdmin
        .from('attendance')
        .insert([{
            student_id: studentProfileId,
            classroom_id: classroomId,
            status: 'present',
            check_in_time: new Date().toISOString()
        }])
        .select(`
            id,
            status,
            profiles:student_id (id, full_name, student_id)
        `)
        .single();

    if (attErr) throw attErr;
    return newAttendance;
  },

  async removeStudentFromExam(attendanceId) {
      const { error } = await supabaseAdmin
          .from('attendance')
          //.delete() shouldnt delete the record, just mark as removed
          .update({ status: 'absent' })
          .eq('id', attendanceId);
      
      if (error) throw error;
      return { success: true };
  },

  // async searchEligibleStudents(examId, searchTerm) {
  //         // 1. קבלת ה-course_id של המבחן הנוכחי
  //         console.log("Searching eligible students for exam ID:", examId, "with search term:", searchTerm);
  //   const { data: exam } = await supabaseAdmin
  //       .from('exams')
  //       .select('course_id')
  //       .eq('id', examId)
  //       .single();

  //   if (!exam) throw new Error("Exam not found");

  //   // 2. מציאת כל הסטודנטים שכבר נמצאים בחדרים של המבחן הזה
  //   // ב-Supabase Join מתבצע על ידי ציון שם הטבלה המקושרת ב-select
  //   const { data: existingAttendance, error: attError } = await supabaseAdmin
  //       .from('attendance')
  //       .select('student_id, classrooms!inner(exam_id)')
  //       .eq('classrooms.exam_id', examId)
  //       .neq('status', 'absent');

  //   if (attError) throw attError;
  //   const excludedProfileIds = existingAttendance?.map(a => a.student_id) || [];

  //   // 3. חיפוש סטודנטים שרשומים לקורס הזה ב-course_registrations
  //   let query = supabaseAdmin
  //       .from('course_registrations')
  //       .select(`
  //           profiles!inner (
  //               id,
  //               student_id,
  //               full_name
  //           )
  //       `)
  //       .eq('course_id', exam.course_id);

  //   // הוספת חיפוש לפי שם או ת"ז אם קיים
  //   if (searchTerm) {
  //       query = query.or(`full_name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`, { foreignTable: 'profiles' });
  //   }

  //   const { data: registrations, error: regError } = await query.limit(15);
  //   if (regError) throw regError;

  //   // 4. סינון אלו שכבר רשומים למבחן (כבר בחדר) ושיטוח המבנה
  //   return registrations
  //       .map(reg => reg.profiles)
  //       .filter(profile => !excludedProfileIds.includes(profile.id));
  // }

  async searchEligibleStudents(examId, searchTerm) {
    // 1. קבלת ה-course_id מהמבחן
    const { data: exam } = await supabaseAdmin
        .from('exams')
        .select('course_id')
        .eq('id', examId)
        .single();

    if (!exam) throw new Error("Exam not found");

    // 2. מציאת סטודנטים ש"תפוסים" כרגע (סטטוס לא absent)
    // אלו הסטודנטים שלא נרצה להציג בחיפוש כי הם כבר בתוך המבחן
    const { data: activeAttendance } = await supabaseAdmin
        .from('attendance')
        .select('student_id, classrooms!inner(exam_id)')
        .eq('classrooms.exam_id', examId)
        .neq('status', 'absent'); 

    const activeProfileIds = activeAttendance?.map(a => a.student_id) || [];

    // 3. מקור האמת: חיפוש ב-course_registrations
    // אנחנו מביאים את כל מי שרשום לקורס הזה
    let query = supabaseAdmin
        .from('course_registrations')
        .select(`
            profiles!inner (
                id,
                student_id,
                full_name
            )
        `)
        .eq('course_id', exam.course_id);

    // הוספת חיפוש טקסטואלי
    if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`, { foreignTable: 'profiles' });
    }

    const { data: registrations, error: regError } = await query.limit(15);
    if (regError) throw regError;

    // 4. הסינון הסופי:
    // מחזירים את כל מי שרשום לקורס (מ-registrations) 
    // בתנאי שהוא לא מופיע ברשימת ה-active (אלו שכרגע בסטטוס present/submitted וכו')
    return registrations
        .map(reg => reg.profiles)
        .filter(profile => !activeProfileIds.includes(profile.id));
}

};