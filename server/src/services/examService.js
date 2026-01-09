import { supabaseAdmin } from '../lib/supabaseClient.js';
import { AuditTrailService } from './auditTrailService.js';

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
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
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
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
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
  async createExam({ course_code, original_start_time, original_duration }) {
    // First, look up the course by course_code to get the course_id (uuid)
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('course_code', course_code)
      .single();

    if (courseError || !course) {
      const err = new Error(`Course with code '${course_code}' not found`);
      err.status = 400;
      throw err;
    }

    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert([
        {
          course_id: course.id, // Use the course uuid
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
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
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
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
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
        status,
        courses:course_id (
          id,
          course_name,
          course_code
        )
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
  async getExamTiming(examId) {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .select('original_start_time, original_duration, extra_time') // הוספנו גם זמן הארכה
      .eq('id', examId)
      .single();

    if (error) {
        console.error("Error fetching timing:", error);
        throw error;
    }

    // חשוב: ה-Frontend מצפה לשמות שדות ב-camelCase
    return {
        startTime: data.original_start_time,
        originalDuration: data.original_duration,
        extraTime: data.extra_time || 0
    };
  }
};
