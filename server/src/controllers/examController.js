import { ExamService } from '../services/examService.js';
import { AuditTrailService } from '../services/auditTrailService.js';


const ALLOWED_STATUS = new Set(['pending', 'active', 'finished']);

export const ExamController = {
  async list(req, res, next) {
    try {
      const status = req.query.status || null; // e.g. "active"
      const exams = await ExamService.listExams(status);
      res.json(exams);
    } catch (err) {
      next(err);
    }
  },

  async listCourses(req, res, next) {
    try {
      const courses = await ExamService.listAllCourses();
      res.json(courses);
    } catch (err) {
      next(err);
    }
  },


  //added for new tables
  async listCourseLecturers(req, res, next) {
    try {
      const { courseId } = req.params;
      const lecturers = await ExamService.listCourseLecturers(courseId);
      res.json({ lecturers });
    } catch (err) { next(err); }
  },

  async listExamLecturers(req, res, next) {
    try {
      const { id: examId } = req.params;
      const lecturers = await ExamService.listExamLecturers(examId);
      res.json({ lecturers });
    } catch (err) { next(err); }
  },

  async addExamLecturer(req, res, next) {
    try {
      const { id: examId } = req.params;
      const { lecturerId } = req.body;
      if (!lecturerId) return res.status(400).json({ error: 'lecturerId is required' });

      const row = await ExamService.addExamLecturer(examId, lecturerId);
      res.status(201).json({ row });
    } catch (err) { next(err); }
  },

  async removeExamLecturer(req, res, next) {
    try {
      const { id: examId, lecturerId } = req.params;
      const result = await ExamService.removeExamLecturer(examId, lecturerId);
      res.json(result);
    } catch (err) { next(err); }
  },

  async listExamsByLecturer(req, res, next) {
    try {
      const { lecturerId } = req.params;
      const exams = await ExamService.listExamsByLecturer(lecturerId);
      res.json(exams);
    } catch (err) { next(err); }
  },

  async getAvailableExamLecturers(req, res, next) {
    try {
      const { id: examId } = req.params;
      const lecturers = await ExamService.getAvailableExamLecturers(examId);
      res.json(lecturers);
    } catch (err) { next(err); }
  },



  async getOne(req, res, next) {
    try {
      const exam = await ExamService.getExamById(req.params.id);
      res.json({ exam });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { course_code, original_start_time, original_duration } = req.body;

      if (!course_code || !original_start_time || typeof original_duration !== 'number') {
        return res.status(400).json({
          error: 'course_code, original_start_time, original_duration (number) are required',
        });
      }

      const exam = await ExamService.createExam({
        course_code,
        original_start_time,
        original_duration,
      });

      await AuditTrailService.log({
        userId: req.user?.id ?? null,
        action: 'exam.created',
        metadata: {
          examId: exam.id,
          courseId: exam.course_id,
        },
      });


      res.status(201).json({ exam });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status, userId } = req.body;

      if (!ALLOWED_STATUS.has(status)) {
        return res.status(400).json({
          error: 'status must be one of: pending, active, finished',
        });
      }

      const { exam, updatedStudents, report } = await ExamService.updateStatus(req.params.id, status, userId);
      res.json({ exam, updatedStudents, report });
    } catch (err) {
      next(err);
    }
  },

  async addExtraTime(req, res, next) {
    try {
      const { minutes } = req.body;
      if (typeof minutes !== 'number' || minutes <= 0) {
        return res.status(400).json({ error: 'minutes must be a positive number' });
      }

      const exam = await ExamService.addExtraTime(req.params.id, minutes);

      await AuditTrailService.log({
        userId: req.user?.id ?? null,
        action: 'exam.extra_time_added',
        metadata: {
          examId: exam.id,
          minutesAdded: minutes,
          newExtraTime: exam.extra_time,
        },
      });

      res.json({ exam });
    } catch (err) {
      next(err);
    }
  },

  async broadcastAnnouncement(req, res, next) {
    try {
      const { message } = req.body;
      const { id: examId } = req.params;
      const userId = req.user?.id ?? null;

      if (!message) {
        return res.status(400).json({ error: 'message is required' });
      }

      await ExamService.broadcastAnnouncement(examId, message, userId);

      res.status(200).json({ success: true, message: 'Announcement sent' });
    } catch (err) {
      next(err);
    }
  },

  async getTiming(req, res, next) {
    try {
      const exam = await ExamService.getExamById(req.params.id);
      res.json({
        startTime: exam.original_start_time,
        originalDuration: exam.original_duration,
        extraTime: exam.extra_time || 0,
        isPaused: false // For now, assume not paused
      });
    } catch (err) {
      next(err);
    }
  },
};
