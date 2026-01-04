import { AttendanceService } from '../services/attendanceService.js';

export const AttendanceController = {
  async list(req, res, next) {
    try {
      const classroomId = req.query.classroom_id || null;
      const examId = req.query.exam_id || null;

      if (!classroomId && !examId) {
        return res.status(400).json({
          error: 'Provide classroom_id or exam_id',
        });
      }

      const items = await AttendanceService.list({ classroomId, examId });
      res.json({ attendance: items });
    } catch (err) {
      next(err);
    }
  },

  async mark(req, res, next) {
    try {
      const { student_id, classroom_id, status } = req.body;

      if (!student_id || !classroom_id || !status) {
        return res.status(400).json({
          error: 'student_id, classroom_id, status are required',
        });
      }

      const record = await AttendanceService.mark({ student_id, classroom_id, status });
      res.json({ attendance: record });
    } catch (err) {
      next(err);
    }
  },

  async startBreak(req, res, next) {
    try {
      const { attendance_id, reason } = req.body;

      if (!attendance_id) {
        return res.status(400).json({ error: 'attendance_id is required' });
      }

      const result = await AttendanceService.startBreak({ attendance_id, reason });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async endBreak(req, res, next) {
    try {
      const { break_id } = req.body;

      if (!break_id) {
        return res.status(400).json({ error: 'break_id is required' });
      }

      const result = await AttendanceService.endBreak({ break_id });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
