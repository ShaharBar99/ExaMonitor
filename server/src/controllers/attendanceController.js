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

  async getStudentsByRoom(req, res, next) {
    try {
      const { examId, supervisorId } = req.params;
      const students = await AttendanceService.getStudentsByRoom(examId, supervisorId);
      console.log("Fetched students for room:", students);
      res.json(students);
    } catch (err) {
      next(err);
    }
  },

  async updateStudentStatus(req, res, next) {
    try {
      const { studentId } = req.params;
      const { status } = req.body;
      const result = await AttendanceService.updateStudentStatus(studentId, status);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getExamsOnFloor(req, res, next) {
    try {
      const { floorId } = req.params;
      const exams = await AttendanceService.getExamsOnFloor(floorId);
      res.json(exams);
    } catch (err) {
      next(err);
    }
  },

  async assignSupervisor(req, res, next) {
    try {
      const { roomId } = req.params;
      const { supervisorId } = req.body;
      const result = await AttendanceService.assignSupervisor(roomId, supervisorId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getFloorSummary(req, res, next) {
    try {
      const { floorId } = req.query;
      const summary = await AttendanceService.getFloorSummary(floorId);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },

  async getStudentsForSupervisor(req, res, next) {
    try {
      const { supervisorId, examId } = req.params;
      const students = await AttendanceService.getStudentsForSupervisor(examId, supervisorId);
      res.json(students);
    } catch (err) {
      next(err);
    }
  },
};
