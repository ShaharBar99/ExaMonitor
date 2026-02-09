import { supabaseAdmin } from '../lib/supabaseClient.js';

function toDate(d) {
  return d ? new Date(d) : null;
}

function timesOverlap(s1, e1, s2, e2) {
  if (!s1 || !e1 || !s2 || !e2) return false;
  return (s1 < e2) && (s2 < e1);
}

async function getExamWindow(examId) {
  const { data, error } = await supabaseAdmin
    .from('exams')
    .select('original_start_time, original_duration, extra_time')
    .eq('id', examId)
    .single();

  if (error || !data) return null;
  const start = toDate(data.original_start_time);
  const duration = Number(data.original_duration || 0) + Number(data.extra_time || 0);
  const end = new Date(start.getTime() + duration * 60000);
  return { start, end };
}

export async function check_conflicts(type, payload = {}) {
  // type: 'classroom_create' | 'classroom_update' | 'assign_supervisor' | 'import_row' | 'exam_update'
  // payload varies
  const errors = [];

  // Helper: resolve exam window for given exam id
  const examWindow = payload.exam_id ? await getExamWindow(payload.exam_id) : null;

  // --- Supervisor Scheduling Conflict ---
  if (payload.supervisor_id && examWindow) {
    const { data: conflicts, error } = await supabaseAdmin
      .from('classrooms')
      .select('id, room_number, exam_id, exams(original_start_time, original_duration, extra_time)')
      .eq('supervisor_id', payload.supervisor_id)
      // Exclude the classroom we are currently updating from the conflict check list
      .neq('id', payload.existing_classroom_id || '00000000-0000-0000-0000-000000000000');

    if (!error && Array.isArray(conflicts)) {
      for (const c of conflicts) {
        if (!c.exams) continue;
        const s = toDate(c.exams.original_start_time);
        const dur = Number(c.exams.original_duration || 0) + Number(c.exams.extra_time || 0);
        const e = new Date(s.getTime() + dur * 60000);
        
        // A conflict exists if times overlap.
        if (timesOverlap(examWindow.start, examWindow.end, s, e)) {
          errors.push(`המשגיח כבר משובץ לחדר ${c.room_number} בטווח הזמן הזה.`);
        }
      }
    }
  }

  // --- Floor Supervisor Scheduling Conflict ---
  if (payload.floor_supervisor_id && examWindow) {
    const { data: conflicts, error } = await supabaseAdmin
      .from('classrooms')
      .select('id, room_number, exam_id, exams(original_start_time, original_duration, extra_time)')
      .eq('floor_supervisor_id', payload.floor_supervisor_id)
      // Exclude the classroom we are currently updating from the conflict check list
      .neq('id', payload.existing_classroom_id || '00000000-0000-0000-0000-000000000000');

    if (!error && Array.isArray(conflicts)) {
      for (const c of conflicts) {
        if (!c.exams) continue;
        const s = toDate(c.exams.original_start_time);
        const dur = Number(c.exams.original_duration || 0) + Number(c.exams.extra_time || 0);
        const e = new Date(s.getTime() + dur * 60000);
        
        // A conflict exists if times overlap AND it's for a different exam.
        if (timesOverlap(examWindow.start, examWindow.end, s, e) && c.exam_id !== payload.exam_id) {
          errors.push(`המשגיח הראשי (Floor Supervisor) כבר משובץ לחדר ${c.room_number} בבחינה מקבילה.`);
        }
      }
    }
  }

  // Classroom allocation conflict: same room assigned to different exam at same time
  if (payload.room_number && examWindow) {
    const { data: rooms, error } = await supabaseAdmin
      .from('classrooms')
      .select('id, room_number, exam_id, exams(original_start_time, original_duration, extra_time)')
      .ilike('room_number', String(payload.room_number).trim());

    if (!error && Array.isArray(rooms)) {
      for (const r of rooms) {
        if (!r.exams) continue;
        const s = toDate(r.exams.original_start_time);
        const dur = Number(r.exams.original_duration || 0) + Number(r.exams.extra_time || 0);
        const e = new Date(s.getTime() + dur * 60000);
        if (timesOverlap(examWindow.start, examWindow.end, s, e)) {
          if (payload.existing_classroom_id && payload.existing_classroom_id === r.id && r.exam_id === payload.exam_id) continue;
          errors.push(`חדר ${payload.room_number} כבר משובץ לבחינה אחרת (${r.exam_id}) בטווח הזמן הזה.`);
        }
      }
    }
  }

  // Student conflicts (stubbed): if payload.student_id present, check attendance/registrations
  if (payload.student_id && examWindow) {
    // Check attendance -> find classrooms student registered for their exams (course registrations may not exist)
    const { data: attendanceRows } = await supabaseAdmin
      .from('attendance')
      .select('classroom_id')
      .eq('student_id', payload.student_id);

    if (Array.isArray(attendanceRows)) {
      // For each classroom, get exam window
      for (const a of attendanceRows) {
        const { data: c } = await supabaseAdmin
          .from('classrooms')
          .select('exam_id, room_number, exams(original_start_time, original_duration, extra_time)')
          .eq('id', a.classroom_id)
          .single();
        if (!c || !c.exams) continue;
        const s = toDate(c.exams.original_start_time);
        const dur = Number(c.exams.original_duration || 0) + Number(c.exams.extra_time || 0);
        const e = new Date(s.getTime() + dur * 60000);
        if (timesOverlap(examWindow.start, examWindow.end, s, e)) {
          errors.push(`סטודנט עם ת"ז ${payload.student_id} כבר רשום או נמצא בנוכחות בבחינה בחדר ${c.room_number} בטווח הזמן הזה.`);
        }
      }
    }
  }

  // Toilet break sync: if payload.check_toilet (contains attendance_id), prevent another active break
  if (payload.check_toilet && payload.classroom_id) {
    // Find any active student_breaks in the same classroom using a join.
    // This is much more efficient than the previous N+1 query.
    const { data: conflictingBreaks, error: conflictError } = await supabaseAdmin
      .from('student_breaks')
      .select('attendance_id, attendance!inner(classroom_id)')
      .is('return_time', null)
      .eq('attendance.classroom_id', payload.classroom_id)
      .limit(1); // We only need to know if at least one exists.

    if (conflictError) {
      console.error('Error checking for break conflicts:', conflictError);
      const err = new Error('Could not verify break conflicts due to a database error.');
      err.status = 500;
      throw err;
    } else if (conflictingBreaks && conflictingBreaks.length > 0) {
      errors.push('סטודנט אחר מהכיתה הזו כבר נמצא בהפסקת שירותים.');
    }
  }

  return errors;
}

export default { check_conflicts };
