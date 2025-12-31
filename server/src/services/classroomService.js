import { supabaseAdmin } from '../lib/supabaseClient.js';

export const ClassroomService = {
  // GET /classrooms?exam_id=...
  async listClassrooms(examId) {
    let query = supabaseAdmin
      .from('classrooms')
      .select('id, exam_id, room_number, supervisor_id, floor_supervisor_id')
      .order('room_number', { ascending: true });

    if (examId) query = query.eq('exam_id', examId);

    const { data, error } = await query;

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data || [];
  },

  // GET /classrooms/:id
  async getById(classroomId) {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .select('id, exam_id, room_number, supervisor_id, floor_supervisor_id')
      .eq('id', classroomId)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 404;
      throw err;
    }

    return data;
  },

  // POST /classrooms
  async create({ exam_id, room_number, supervisor_id = null, floor_supervisor_id = null }) {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .insert([{ exam_id, room_number, supervisor_id, floor_supervisor_id }])
      .select('id, exam_id, room_number, supervisor_id, floor_supervisor_id')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data;
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
      .select('id, exam_id, room_number, supervisor_id, floor_supervisor_id')
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data;
  },
};
