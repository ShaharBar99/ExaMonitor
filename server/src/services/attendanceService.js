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
        profiles:student_id (full_name, student_id, personal_extra_time)
      `)
      .eq('classroom_id', classroom.id)
      .neq('status', 'absent');

    if (attErr) throw attErr;

    return students.map(s => ({
      id: s.id, // attendanceId as id
      studentId: s.profiles?.student_id,
      name: s.profiles?.full_name,
      status: s.status,
      classroomId: classroom.id, // עכשיו אנחנו יודעים בוודאות באיזה חדר אנחנו
      personalExtra: s.profiles?.personal_extra_time || 0
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
 /**
 * חזרה מהפסקה - סגירת רשומת ה-break האחרונה והחזרת הסטטוס ל-present
 */
async endBreak({ attendanceId }) {
    const now = new Date().toISOString();
    console.log("Ending break for attendance ID:", attendanceId);

  // 1. איתור ההפסקה הפתוחה האחרונה של הסטודנט (זמן חזרה הוא NULL)
  // אנחנו ממיינים לפי exit_time יורד ולוקחים רק 1 כדי להיות בטוחים
    const { data: openBreaks, error: findErr } = await supabaseAdmin
      .from('student_breaks')
      .select('id')
      .eq('attendance_id', attendanceId)
      .is('return_time', null)
      .order('exit_time', { ascending: false })
      .limit(1);

    if (findErr) throw findErr;

    let closedBreak = null;

    // 2. אם נמצאה הפסקה פתוחה, נעדכן אותה
    if (openBreaks && openBreaks.length > 0) {
      const { data: brk, error: breakErr } = await supabaseAdmin
        .from('student_breaks')
        .update({ return_time: now })
        .eq('id', openBreaks[0].id) // עדכון לפי ה-ID הספציפי של השורה
        .select()
        .single();

      if (breakErr) throw breakErr;
      closedBreak = brk;
    } else {
      console.warn("No open break found for this student, but proceeding to reset status.");
    }

    // 3. החזרת סטטוס הנוכחות ל"נוכח" (בכל מקרה, כדי שהסטודנט לא ייתקע בחוץ)
    const { data: att, error: attErr } = await supabaseAdmin
      .from('attendance')
      .update({ status: 'present' })
      .eq('id', attendanceId)
      .select()
      .single();

    if (attErr) throw attErr;

    return { 
      success: true, 
      break: closedBreak, 
      attendance: att,
      wasBreakFound: !!closedBreak 
    };
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
 * הוספת סטודנט לחדר מבחן ידנית - גרסה חסינת כפילויות
 */
async addStudentToExam(classroomId, studentProfileId = null, studentId = null) {
    let finalProfileId = studentProfileId;
    console.log("Adding student to classroom:", classroomId, "with profile ID:", studentProfileId, "or student ID:", studentId);
    // 1. אם קיבלנו studentId (ת"ז) ולא UUID, נמיר אותו ל-UUID מהפרופיל
    if (studentId !== null && !finalProfileId) {
        const { data: profile, error: profErr } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('student_id', studentId) // מחפש בעמודה של תעודות הזהות
            .single();

        if (profErr || !profile) {
            throw new Error(`לא נמצא סטודנט עם תעודת זהות ${studentId}`);
        }
        finalProfileId = profile.id;
    }

    if (!finalProfileId) {
        throw new Error("חובה לספק מזהה פרופיל או תעודת זהות");
    }

    // 2. קבלת פרטי המבחן והקורס
    const { data: classroom, error: classErr } = await supabaseAdmin
        .from('classrooms')
        .select('exam_id, exams(course_id)')
        .eq('id', classroomId)
        .single();

    if (classErr) throw classErr;
    const examId = classroom.exam_id;

    // 3. בדיקה שהסטודנט רשום לקורס
    const { data: registration, error: regErr } = await supabaseAdmin
        .from('course_registrations')
        .select('id')
        .eq('student_id', finalProfileId)
        .eq('course_id', classroom.exams.course_id)
        .maybeSingle(); // שימוש ב-maybeSingle גמיש יותר מ-single

    if (regErr || !registration) {
        throw new Error("הסטודנט אינו רשום לקורס זה");
    }

    // 4. חיפוש רשומה קיימת של הסטודנט במבחן הזה
    const { data: existingAttendance, error: fetchErr } = await supabaseAdmin
        .from('attendance')
        .select(`
            id, 
            status,
            classroom_id,
            classrooms!inner(exam_id)
        `)
        .eq('student_id', finalProfileId)
        .eq('classrooms.exam_id', examId)
        .maybeSingle();

    if (fetchErr) throw fetchErr;

    // קביעת הסטטוס
    let finalStatus = 'present';
    if (existingAttendance) {
        if (existingAttendance.status === 'submitted' || existingAttendance.status === 'finished') {
            finalStatus = 'submitted';
        } else if (existingAttendance.status === 'present' || existingAttendance.status === 'exited_temporarily') {
            finalStatus = existingAttendance.status; // שומרים על סטטוס קיים אם הוא כבר במבחן או בשירותים
        }
    }

    // 5. ביצוע ה-Upsert
    const attendanceData = {
        student_id: finalProfileId,
        classroom_id: classroomId,
        status: finalStatus,
        check_in_time: existingAttendance?.check_in_time || new Date().toISOString()
    };

    if (existingAttendance) {
        attendanceData.id = existingAttendance.id;
    }

    const { data: result, error: upsertErr } = await supabaseAdmin
        .from('attendance')
        .upsert([attendanceData])
        .select(`
            id,
            status,
            profiles:student_id (id, full_name, student_id)
        `)
        .single();

    if (upsertErr) throw upsertErr;
    return result;
},

  async removeStudentFromExam(attendanceId) {
    // 1. קודם כל נבדוק מה הסטטוס הנוכחי של הסטודנט
    const { data: currentRecord, error: fetchError } = await supabaseAdmin
        .from('attendance')
        .select('status')
        .eq('id', attendanceId)
        .single();

    if (fetchError) throw fetchError;

    // 2. אם הסטודנט כבר הגיש (submitted/finished), אנחנו לא רוצים להפוך אותו לנעדר
    if (currentRecord.status === 'submitted' || currentRecord.status === 'finished') {
        return { 
            success: false, 
            message: "לא ניתן להסיר סטודנט שכבר הגיש את המבחן" 
        };
    }

    // 3. אם הוא לא הגיש, אפשר לשנות ל-absent
    const { error: updateError } = await supabaseAdmin
        .from('attendance')
        .update({ status: 'absent' })
        .eq('id', attendanceId);
    
    if (updateError) throw updateError;
    
    return { success: true };
  },

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