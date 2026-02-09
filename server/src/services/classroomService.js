import { supabaseAdmin } from '../lib/supabaseClient.js';
import validationService from './validationService.js';

export const ClassroomService = {
  // GET /classrooms?exam_id=... or ?lecturer_id=...
  async listClassrooms(examId, lecturerId = null) {
    // If lecturerId provided, compute exam ids taught by that lecturer and filter classrooms
    if (lecturerId) {
      // 1) find courses for lecturer
      const { data: courses, error: coursesErr } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('lecturer_id', lecturerId);

      if (coursesErr) {
        const err = new Error(coursesErr.message);
        err.status = 400;
        throw err;
      }

      const courseIds = (courses || []).map(c => c.id);
      if (courseIds.length === 0) return [];

      // 2) find exams for those courses
      const { data: exams, error: examsErr } = await supabaseAdmin
        .from('exams')
        .select('id')
        .in('course_id', courseIds);

      if (examsErr) {
        const err = new Error(examsErr.message);
        err.status = 400;
        throw err;
      }

      const examIds = (exams || []).map(e => e.id);
      if (examIds.length === 0) return [];

      // 3) fetch classrooms for those exam ids
      const { data, error } = await supabaseAdmin
        .from('classrooms')
        .select(`
          id,
          exam_id,
          room_number,
          supervisor_id,
          floor_supervisor_id,
          exams:exam_id (
            id,
            status,
            courses:course_id (
              id,
              course_name,
              course_code
            )
          ),
          supervisor:supervisor_id (
            id,
            full_name
          ),
          floor_supervisor:floor_supervisor_id (
            id,
            full_name
          )
        `)
        .in('exam_id', examIds)
        .order('room_number', { ascending: true });

      if (error) {
        const err = new Error(error.message);
        err.status = 400;
        throw err;
      }

      return (data || []).map(classroom => ({
        id: classroom.id,
        examName: classroom.exams?.courses?.course_name || classroom.exam_id,
        status: classroom.exams?.status || 'unknown',
        supervisor: classroom.supervisor?.full_name || null,
        floor: Math.floor(classroom.room_number / 100),
        room_number: classroom.room_number,
        exam_id: classroom.exam_id,
        supervisor_id: classroom.supervisor_id,
        floor_supervisor_id: classroom.floor_supervisor_id
      }));
    }

    // Default path: filter by examId if provided, otherwise return all
    let query = supabaseAdmin
      .from('classrooms')
      .select(`
        id,
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
        exams:exam_id (
          id,
          status,
          courses:course_id (
            id,
            course_name,
            course_code
          )
        ),
        supervisor:supervisor_id (
          id,
          full_name
        ),
        floor_supervisor:floor_supervisor_id (
          id,
          full_name
        )
      `)
      .order('room_number', { ascending: true });

    if (examId) query = query.eq('exam_id', examId);

    const { data, error } = await query;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    // Transform the data to match frontend expectations
    return (data || []).map(classroom => ({
      id: classroom.id,
      examName: classroom.exams?.courses?.course_name || classroom.exam_id, // fallback to course_id if no courses table
      status: classroom.exams?.status || 'unknown',
      supervisor: classroom.supervisor?.full_name || null,
      floor: Math.floor(classroom.room_number / 100), // extract floor from room number (301 -> 3)
      room_number: classroom.room_number,
      exam_id: classroom.exam_id,
      supervisor_id: classroom.supervisor_id,
      floor_supervisor_id: classroom.floor_supervisor_id
    }));
  },

  // GET /classrooms/:id
  async getById(classroomId) {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .select(`
        id,
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
        exams:exam_id (
          id,
          status,
          courses:course_id (
            id,
            course_name,
            course_code
          )
        ),
        supervisor:supervisor_id (
          id,
          full_name
        ),
        floor_supervisor:floor_supervisor_id (
          id,
          full_name
        )
      `)
      .eq('id', classroomId)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 404;
      throw err;
    }

    // Transform the data to match frontend expectations
    return {
      id: data.id,
      examName: data.exams?.courses?.course_name || data.exam_id,
      status: data.exams?.status || 'unknown',
      supervisor: data.supervisor?.full_name || null,
      floor: Math.floor(data.room_number / 100),
      room_number: data.room_number,
      exam_id: data.exam_id,
      supervisor_id: data.supervisor_id,
      floor_supervisor_id: data.floor_supervisor_id
    };
  },

  // POST /classrooms
  async create({ exam_id, room_number, supervisor_id = null, floor_supervisor_id = null }) {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .insert([{ exam_id, room_number, supervisor_id, floor_supervisor_id }])
      .select(`
        id,
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
        exams:exam_id (
          id,
          status,
          courses:course_id (
            id,
            course_name,
            course_code
          )
        ),
        supervisor:supervisor_id (
          id,
          full_name
        ),
        floor_supervisor:floor_supervisor_id (
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    // Transform the data to match frontend expectations
    return {
      id: data.id,
      examName: data.exams?.courses?.course_name || data.exam_id,
      status: data.exams?.status || 'unknown',
      supervisor: data.supervisor?.full_name || null,
      floor: Math.floor(data.room_number / 100),
      room_number: data.room_number,
      exam_id: data.exam_id,
      supervisor_id: data.supervisor_id,
      floor_supervisor_id: data.floor_supervisor_id
    };
  },

  // PATCH /classrooms/:id/assign
  async updateAssignments(classroomId, { supervisor_id, floor_supervisor_id }) {
    const update = {};
    if (supervisor_id !== undefined) update.supervisor_id = supervisor_id;
    if (floor_supervisor_id !== undefined) update.floor_supervisor_id = floor_supervisor_id;

    // Fetch existing classroom to get exam context for validation
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('classrooms')
      .select('id, exam_id, room_number')
      .eq('id', classroomId)
      .single();

    if (fetchErr || !existing) {
      const err = new Error('Classroom not found');
      err.status = 404;
      throw err;
    }

    const conflicts = await validationService.check_conflicts('assign_supervisor', {
      existing_classroom_id: classroomId,
      exam_id: existing.exam_id,
      room_number: existing.room_number,
      supervisor_id: supervisor_id,
      floor_supervisor_id: floor_supervisor_id,
    });

    if (conflicts && conflicts.length > 0) {
      const err = new Error(conflicts.join('; '));
      err.status = 409;
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .update(update)
      .eq('id', classroomId)
      .select(`
        id,
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
        exams:exam_id (
          id,
          status,
          courses:course_id (
            id,
            course_name,
            course_code
          )
        ),
        supervisor:supervisor_id (
          id,
          full_name
        ),
        floor_supervisor:floor_supervisor_id (
          id,
          full_name
        )
      `)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    // Transform the data to match frontend expectations
    return {
      id: data.id,
      examName: data.exams?.courses?.course_name || data.exam_id,
      status: data.exams?.status || 'unknown',
      supervisor: data.supervisor?.full_name || null,
      floor: Math.floor(data.room_number / 100),
      room_number: data.room_number,
      exam_id: data.exam_id,
      supervisor_id: data.supervisor_id,
      floor_supervisor_id: data.floor_supervisor_id
    };
  },

  // GET supervisors for assignment (accessible to floor supervisors)
  async getSupervisors() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'supervisor')
      .order('full_name', { ascending: true });

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    // Transform full_name to name for frontend compatibility
    return (data || []).map(supervisor => ({
      id: supervisor.id,
      name: supervisor.full_name
    }));
  },
};
