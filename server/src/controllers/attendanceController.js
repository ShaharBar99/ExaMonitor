import { AttendanceService } from '../services/attendanceService.js';
import { supabaseAdmin } from '../lib/supabaseClient.js';

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
      const { student_id, reason = 'toilet' } = req.body;

      if (!student_id) {
        return res.status(400).json({ error: 'student_id and classroom_id are required' });
      }
      const attendance = student_id;
      if (!attendance) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }

      const result = await AttendanceService.startBreak({ attendanceId: attendance, reason });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async endBreak(req, res, next) {
    try {
      const { student_id} = req.body;
      
      if (!student_id) {
        return res.status(400).json({ error: 'student_id and exam_id are required' });
      }
      const attendance = student_id;
      if (!attendance) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }
      console.log("Ending break for attendance ID:", attendance);
      const result = await AttendanceService.endBreak({ attendanceId: attendance });
      res.json(result);
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
      console.log("Fetched students for supervisor:", students);
      res.json(students);
    } catch (err) {
      next(err);
    }
  },

  addStudent: async (req, res, next) => {
      try {
          const { classroomId, studentProfileId } = req.body;
          const result = await AttendanceService.addStudentToExam(classroomId, studentProfileId);
          res.status(201).json(result);
      } catch (err) {
          next(err);
      }
  },

  removeStudent: async (req, res, next) => {
      try {
          const { attendanceId } = req.params;
          await AttendanceService.removeStudentFromExam(attendanceId);
          res.json({ success: true });
      } catch (err) {
          next(err);
      }
  },
  
  getEligibleStudents: async (req, res, next) => {
      try {
          const { examId } = req.params;
          const { query } = req.query;
          console.log("Searching eligible students in controller for exam ID:", examId, "with search term:", query);
          const students = await AttendanceService.searchEligibleStudents(examId, query);
          res.json(students);
      } catch (err) {
          next(err);
      }
  },
};
