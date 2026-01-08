import { supabaseAdmin } from '../lib/supabaseClient.js';

export const ClassroomService = {
  // GET /classrooms?exam_id=...
  async listClassrooms(examId) {
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
