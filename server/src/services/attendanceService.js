import { supabaseAdmin } from '../lib/supabaseClient.js';

const ALLOWED_STATUS = new Set(['present', 'absent', 'exited_temporarily']);

export const AttendanceService = {
  // GET /attendance?classroom_id=...
  // GET /attendance?exam_id=...   (via join classrooms -> exam_id)
  async list({ classroomId, examId }) {
    let query = supabaseAdmin
      .from('attendance')
      .select(`
        id,
        student_id,
        classroom_id,
        status,
        check_in_time,
        check_out_time,
        classrooms:classroom_id ( exam_id, room_number )
      `)
      .order('check_in_time', { ascending: true });

    if (classroomId) {
      query = query.eq('classroom_id', classroomId);
    }

    if (examId) {
      // filter via the joined classrooms
      query = query.eq('classrooms.exam_id', examId);
    }

    const { data, error } = await query;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data || [];
  },

  // POST /attendance/mark
  // Upsert attendance row and set status + times
  async mark({ student_id, classroom_id, status }) {
    if (!ALLOWED_STATUS.has(status)) {
      const err = new Error('Invalid status');
      err.status = 400;
      throw err;
    }

    const now = new Date().toISOString();

    // When present: set check_in_time if missing
    // When absent: do not force check_in_time
    // When exited_temporarily: we mark status, but break table will store the details
    const update = { status };
    if (status === 'present') update.check_in_time = now;

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(
        [{ student_id, classroom_id, ...update }],
        { onConflict: 'student_id,classroom_id' }
      )
      .select('id, student_id, classroom_id, status, check_in_time, check_out_time')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data;
  },

  // POST /attendance/breaks/start
  async startBreak({ attendance_id, reason = 'toilet' }) {
    const now = new Date().toISOString();

    // Insert break
    const { data: brk, error: breakErr } = await supabaseAdmin
      .from('student_breaks')
      .insert([{ attendance_id, exit_time: now, reason }])
      .select('id, attendance_id, exit_time, return_time, reason')
      .single();

    if (breakErr) {
      const err = new Error(breakErr.message);
      err.status = 400;
      throw err;
    }

    // Update attendance status to exited_temporarily
    const { data: att, error: attErr } = await supabaseAdmin
      .from('attendance')
      .update({ status: 'exited_temporarily' })
      .eq('id', attendance_id)
      .select('id, student_id, classroom_id, status, check_in_time, check_out_time')
      .single();

    if (attErr) {
      const err = new Error(attErr.message);
      err.status = 400;
      throw err;
    }

    return { break: brk, attendance: att };
  },

  // POST /attendance/breaks/end
  async endBreak({ break_id }) {
    const now = new Date().toISOString();

    // Set return_time
    const { data: brk, error: breakErr } = await supabaseAdmin
      .from('student_breaks')
      .update({ return_time: now })
      .eq('id', break_id)
      .select('id, attendance_id, exit_time, return_time, reason')
      .single();

    if (breakErr) {
      const err = new Error(breakErr.message);
      err.status = 400;
      throw err;
    }

    // Mark attendance back to present
    const { data: att, error: attErr } = await supabaseAdmin
      .from('attendance')
      .update({ status: 'present' })
      .eq('id', brk.attendance_id)
      .select('id, student_id, classroom_id, status, check_in_time, check_out_time')
      .single();

    if (attErr) {
      const err = new Error(attErr.message);
      err.status = 400;
      throw err;
    }

    return { break: brk, attendance: att };
  },
};
