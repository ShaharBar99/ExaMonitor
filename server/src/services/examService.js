import { supabaseAdmin } from '../lib/supabaseClient.js';

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
        status
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
        status
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
  async createExam({ course_id, original_start_time, original_duration }) {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert([
        {
          course_id,
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
        status
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
  async updateStatus(examId, status) {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .update({ status })
      .eq('id', examId)
      .select(`
        id,
        course_id,
        original_start_time,
        original_duration,
        extra_time,
        status
      `)
      .single();

    if (error) {
      const err = new Error(error.message);
      err.status = 400;
      throw err;
    }

    return data;
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
        status
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
};
