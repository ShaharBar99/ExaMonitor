import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AuditTrailService } from './auditTrailService.js';

const ALLOWED_STATUS = new Set(['present', 'absent', 'exited_temporarily', 'submitted']);

/**
 * Service for handling attendance logic.
 */
export const AttendanceService = {
  
  /**
   * Lists attendance records based on classroom or exam.
   * @param {object} params
   * @param {string} [params.classroomId] - Filter by classroom.
   * @param {string} [params.examId] - Filter by exam.
   * @returns {Promise<Array>} List of attendance records.
   */
  async list({ classroomId = null, examId = null }) {
    // Case 1: list by classroom
    if (classroomId) {
      const { data, error } = await supabaseAdmin
        .from('attendance')
        .select(`
          id,
          student_id,
          classroom_id,
          check_in_time,
          check_out_time,
          status,
          profiles:student_id (personal_extra_time) // שליפת זמן נוסף אישי
        `)
        .eq('classroom_id', classroomId);
      if (error) throw error;

      return data || [];
    }
    
    // Case 2: list by exam (via classrooms)
    if (examId) {
      const { data: rooms, error: roomsErr } = await supabaseAdmin
        .from('classrooms')
        .select('id')
        .eq('exam_id', examId);
      if (roomsErr) throw roomsErr;

      const roomIds = (rooms || []).map(r => r.id);
      if (roomIds.length === 0) return [];

      const { data, error } = await supabaseAdmin
        .from('attendance')
        .select(`
          id,
          student_id,
          classroom_id,
          check_in_time,
          check_out_time,
          status,
          profiles:student_id (personal_extra_time) // שליפת זמן נוסף אישי
        `)
        .in('classroom_id', roomIds);
      if (error) throw error;

      return data || [];
    }

    // If neither provided, return empty
    return [];
  },


  /**
   * Counts the number of breaks for a specific exam.
   * @param {string} examId - The exam ID.
   * @returns {Promise<number>} The count of breaks.
   */
  async countBreaksByExam(examId) {
    const { count, error } = await supabaseAdmin
      .from('student_breaks')
      .select('id, attendance:attendance_id!inner(classrooms:classroom_id!inner(exam_id))', {
        count: 'exact',
        head: true,
      })
      .eq('attendance.classrooms.exam_id', examId);

    if (error) throw error;
    return count || 0;
  },



  
  /**
   * Gets students assigned to a supervisor for a specific exam.
   * @param {string} examId - The exam ID.
   * @param {string} supervisorId - The supervisor ID.
   * @returns {Promise<Array>} List of students.
   */
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
        id, status, student_id,
        profiles:student_id (full_name, student_id, personal_extra_time)
      `)
      .eq('classroom_id', classroom.id)
      .neq('status', 'absent');

    if (attErr) throw attErr;

    return students.map(s => ({
      id: s.id, // attendanceId as id
      profileId: s.student_id, // Profile UUID
      studentId: s.profiles?.student_id,
      name: s.profiles?.full_name,
      status: s.status,
      classroomId: classroom.id, // עכשיו אנחנו יודעים בוודאות באיזה חדר אנחנו
      personalExtra: s.profiles?.personal_extra_time || 0
    }));
  },

  /**
   * Updates a student's attendance status.
   * @param {string} attendanceId - The attendance record ID.
   * @param {string} status - The new status.
   * @returns {Promise<object>} The result of the update.
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
   * Starts a break for a student.
   * @param {object} params
   * @param {string} params.attendanceId - The attendance record ID.
   * @param {string} [params.reason='toilet'] - The reason for the break.
   */
  async startBreak({ attendanceId, reason = 'toilet' }) {
    const now = new Date().toISOString();
    console.log("Starting break for attendance ID:", attendanceId, "with reason:", reason);

    // Resolve attendance to classroom/student
    const { data: attendanceRow, error: attFetchErr } = await supabaseAdmin
      .from('attendance')
      .select('id, classroom_id, student_id')
      .eq('id', attendanceId)
      .single();
    if (attFetchErr || !attendanceRow) {
      const err = new Error('Attendance record not found'); err.status = 404; throw err;
    }

    // Validation: prevent two students from same classroom being on a break simultaneously
    const conflicts = await (await import('./validationService.js')).default.check_conflicts('start_break', {
      check_toilet: true,
      classroom_id: attendanceRow.classroom_id,
      attendance_id: attendanceId,
      student_id: attendanceRow.student_id,
    });

    if (conflicts && conflicts.length > 0) {
      const err = new Error(conflicts.join('; ')); err.status = 409; throw err;
    }

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

    // Audit
    await AuditTrailService.log({
      userId: null,
      action: 'student.start_break',
      metadata: { attendanceId, breakId: brk.id, classroomId: attendanceRow.classroom_id, studentId: attendanceRow.student_id }
    });

    return { success: true, break: brk, attendance: att };
  },

  /**
 * Ends a break for a student.
 * Closes the last open break record and resets status to 'present'.
 * @param {object} params
 * @param {string} params.attendanceId - The attendance record ID.
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

    // Audit the end of break
    await AuditTrailService.log({
      userId: null,
      action: 'student.end_break',
      metadata: { attendanceId, closedBreakId: closedBreak?.id || null, wasBreakFound: !!closedBreak }
    });

    return { 
      success: true, 
      break: closedBreak, 
      attendance: att,
      wasBreakFound: !!closedBreak 
    };
  }, 

  /**
   * Generates a statistical summary for a floor.
   * @param {string} floorId - The floor ID.
   * @returns {Promise<object>} The summary data.
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
   * Assigns a supervisor to a classroom.
   * @param {string} classroomId - The classroom ID.
   * @param {string} supervisorId - The supervisor ID.
   * @returns {Promise<object>} The updated classroom data.
   */
  async assignSupervisor(classroomId, supervisorId) {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .update({ supervisor_id: supervisorId })
      .eq('id', classroomId)
      .select()
      .single();

    if (error) throw error;
    // Audit assign supervisor
    await AuditTrailService.log({ userId: null, action: 'assign.supervisor', metadata: { classroomId, supervisorId } }).catch(() => {});
    return { success: true, data };
  },

/**
 * Manually adds a student to an exam classroom.
 * Handles profile resolution and duplicate checks.
 * @param {string} classroomId - The classroom ID.
 * @param {string} [studentProfileId] - The student's profile ID.
 * @param {string} [studentId] - The student's ID number.
 */
async addStudentToExam(classroomId, studentProfileId = null, studentId = null) {
    let finalProfileId = studentProfileId;
    console.log("Adding student to classroom:", classroomId, "with profile ID:", studentProfileId, "or student ID:", studentId);

    // 1. Convert student_id (ID number) to Profile UUID if needed
    if (studentId !== null && !finalProfileId) {
        const { data: profiles, error: profErr } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('student_id', studentId)
            .limit(1); // Returns an array

        if (profErr || !profiles || profiles.length === 0) {
            throw new Error(`לא נמצא סטודנט עם תעודת זהות ${studentId}`);
        }
        finalProfileId = profiles[0].id; // Extract from array
    }

    if (!finalProfileId) {
        throw new Error("חובה לספק מזהה פרופיל או תעודת זהות");
    }

    // 2. Get classroom and course details
    const { data: classroom, error: classErr } = await supabaseAdmin
        .from('classrooms')
        .select('exam_id, exams(course_id)')
        .eq('id', classroomId)
        .maybeSingle();

    if (classErr || !classroom) throw classErr || new Error("כיתה לא נמצאה");
    
    const examId = classroom.exam_id;

    // 3. Verify course registration
    const { data: registration, error: regErr } = await supabaseAdmin
        .from('course_registrations')
        .select('id')
        .eq('student_id', finalProfileId)
        .eq('course_id', classroom.exams.course_id)
        .maybeSingle();

    if (regErr || !registration) {
        throw new Error("הסטודנט אינו רשום לקורס זה");
    }

    // 4. Check for existing attendance in THIS exam
    const { data: attendanceRecords, error: fetchErr } = await supabaseAdmin
        .from('attendance')
        .select(`
            id, 
            status,
            classroom_id,
            check_in_time,
            classrooms!inner(exam_id)
        `)
        .eq('student_id', finalProfileId)
        .eq('classrooms.exam_id', examId)
        .limit(1);

    if (fetchErr) throw fetchErr;
    
    const existingRecord = attendanceRecords?.[0]; // Handle array result

    // Determine status logic
    let finalStatus = 'present';
    if (existingRecord) {
        if (['submitted', 'finished'].includes(existingRecord.status)) {
            finalStatus = 'submitted';
        } else if (['present', 'exited_temporarily'].includes(existingRecord.status)) {
            finalStatus = existingRecord.status;
        }
    }

    // 5. Perform Upsert
    const attendanceData = {
        student_id: finalProfileId,
        classroom_id: classroomId, // Move student to NEW classroom if they switched
        status: finalStatus,
        check_in_time: existingRecord?.check_in_time || new Date().toISOString()
    };

    if (existingRecord) {
        attendanceData.id = existingRecord.id;
    }

    const { data: result, error: upsertErr } = await supabaseAdmin
        .from('attendance')
        .upsert(attendanceData) // Pass object directly for single row upsert
        .select(`
            id,
            status,
            profiles:student_id (id, full_name, student_id)
        `)
        .single(); // Since we are upserting one row, single() is fine here

    if (upsertErr) throw upsertErr;

    // Audit add/update attendance
    await AuditTrailService.log({ userId: null, action: 'attendance.upsert', metadata: { attendanceId: result.id, studentId: finalProfileId, classroomId } }).catch(() => {});

    return result;
},

  /**
   * Removes a student from an exam (marks as absent).
   * @param {string} attendanceId - The attendance record ID.
   * @returns {Promise<object>} Success status.
   */
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

  /**
   * Searches for eligible students for an exam.
   * @param {string} examId - The exam ID.
   * @param {string} searchTerm - The search query.
   * @returns {Promise<Array>} List of eligible student profiles.
   */
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