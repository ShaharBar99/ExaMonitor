import { ClassroomService } from '../services/classroomService.js';

export const ClassroomController = {
  async list(req, res, next) {
    try {
      const examId = req.query.exam_id || null;
      const lecturerId = req.query.lecturer_id || null;
      const classrooms = await ClassroomService.listClassrooms(examId, lecturerId);
      res.json(classrooms);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const classroom = await ClassroomService.getById(req.params.id);
      res.json({ classroom });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { exam_id, room_number, supervisor_id, floor_supervisor_id } = req.body;

      if (!exam_id || !room_number) {
        return res.status(400).json({ error: 'exam_id and room_number are required' });
      }

      const classroom = await ClassroomService.create({
        exam_id,
        room_number,
        supervisor_id,
        floor_supervisor_id,
      });

      res.status(201).json({ classroom });
    } catch (err) {
      next(err);
    }
  },

  async assign(req, res, next) {
    try {
      const { supervisor_id, floor_supervisor_id } = req.body;

      // allow partial updates; at least one field must be provided
      if (supervisor_id === undefined && floor_supervisor_id === undefined) {
        return res.status(400).json({
          error: 'Provide supervisor_id and/or floor_supervisor_id',
        });
      }

      const classroom = await ClassroomService.updateAssignments(req.params.id, {
        supervisor_id,
        floor_supervisor_id,
      });

      res.json({ classroom });
    } catch (err) {
      next(err);
    }
  },

  async getSupervisors(req, res, next) {
    try {
      const supervisors = await ClassroomService.getSupervisors();
      res.json({ supervisors });
    } catch (err) {
      next(err);
    }
  },
};
