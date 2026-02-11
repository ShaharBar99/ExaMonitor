import { AdminService } from '../services/adminService.js';

/**
 * Controller for administrative operations.
 * Handles requests related to users, courses, exams, classrooms, and system audits.
 */
export const AdminController = {
  /**
   * Lists all users in the system.
   */
  async listUsers(req, res, next) {
    try {
      const users = await AdminService.listUsers();
      res.json({ users });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Updates a user's profile information.
   */
  async updateUser(req, res, next) {
    try {
      const user = await AdminService.updateUser(req.params.id, req.body);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Updates a user's role.
   */
  async updateRole(req, res, next) {
    try {
      const { role } = req.body;
      if (!role) return res.status(400).json({ error: 'role is required' });

      const user = await AdminService.updateUserRole(req.params.id, role);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Updates a user's active status.
   */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;

      // Contract expects { status }
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: 'status is required' });
      }

      // Minimal mapping to your current placeholder logic
      // You can extend this later if the doc defines more statuses.
      const normalized = status.toLowerCase();
      let is_active;

      if (normalized === 'active') is_active = true;
      else if (normalized === 'inactive') is_active = false;
      else {
        return res.status(400).json({ error: 'status must be "active" or "inactive"' });
      }

      const user = await AdminService.updateUserStatus(req.params.id, is_active);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Updates a user's permissions.
   */
  async updatePermissions(req, res, next) {
    try {
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'permissions must be an array' });
      }

      const user = await AdminService.updateUserPermissions(req.params.id, permissions);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieves audit logs with pagination.
   */
  async getAudit(req, res, next) {
    try {
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);

      const result = await AdminService.getAudit(limit, offset);
      res.json({ events: result.items });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Lists security alerts (failed login attempts).
   */
  async listSecurityAlerts(req, res, next) {
    try {
      const alerts = await AdminService.listSecurityAlerts(req.query.status);
      res.json({ alerts });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Resolves a security alert.
   */
  async resolveSecurityAlert(req, res, next) {
    try {
      const result = await AdminService.resolveSecurityAlert(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Creates a new user.
   */
  async createUser(req, res, next) {
    try {
      const user = await AdminService.createUser(req.body);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Lists exams with optional filtering.
   */
  async listExams(req, res, next) {
    try {
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      const filters = {
        status: req.query.status,
        q: req.query.q
      };
      const result = await AdminService.listExams(filters, limit, offset);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Creates a new exam.
   */
  async createExam(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const result = await AdminService.createExam(req.body, adminUserId);
      res.status(201).json({ exam: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Updates an existing exam.
   */
  async updateExam(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const result = await AdminService.updateExam(req.params.id, req.body, adminUserId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Imports exams from an Excel file.
   */
  async importExams(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      // Assuming req.user is populated by auth middleware and has id
      const adminUserId = req.user.id;
      const result = await AdminService.importExamsFromExcel(req.file.buffer, adminUserId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Deletes an exam.
   */
  async deleteExam(req, res, next) {
    try {
      await AdminService.deleteExam(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Deletes a user.
   */
  async deleteUser(req, res, next) {
    try {
      await AdminService.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Bulk creates users from an Excel file.
   */
  async bulkCreateUsers(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const result = await AdminService.bulkUsersFromExcel(req.file.buffer);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ========== COURSES ==========

  /**
   * Lists courses with optional filtering.
   */
  async listCourses(req, res, next) {
    try {
      const filters = {
        search: req.query.q,
        lecturer_id: req.query.lecturer_id,
      };
      const courses = await AdminService.listCourses(filters);
      res.json({ courses });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Creates a new course.
   */
  async createCourse(req, res, next) {
    try {
      const result = await AdminService.createCourse(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Updates a course.
   */
  async updateCourse(req, res, next) {
    try {
      const result = await AdminService.updateCourse(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Deletes a course.
   */
  async deleteCourse(req, res, next) {
    try {
      const result = await AdminService.deleteCourse(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Gets students enrolled in a course.
   */
  async getCourseStudents(req, res, next) {
    try {
      const students = await AdminService.getCourseStudents(req.params.id);
      res.json({ students });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Gets available students for a course.
   */
  async getAvailableStudents(req, res, next) {
    try {
      const students = await AdminService.getAvailableStudents(req.params.id);
      res.json({ students });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Adds a student to a course.
   */
  async addStudentToCourse(req, res, next) {
    try {
      const result = await AdminService.addStudentToCourse(req.params.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Bulk adds students to a course from Excel.
   */
  async bulkAddStudentsToCourse(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const result = await AdminService.bulkImportStudentsToCourse(req.params.id, req.file.buffer);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Imports courses from an Excel file.
   */
  async importCourses(req, res, next) {
    console.log('AdminController.importCourses: Request received');
    try {
      if (!req.file) {
        console.log('AdminController.importCourses: No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const result = await AdminService.importCoursesFromExcel(req.file.buffer);
      res.json(result);
    } catch (err) {
      console.error('AdminController.importCourses: Error', err);
      next(err);
    }
  },

  /**
   * Removes a student from a course.
   */
  async removeStudentFromCourse(req, res, next) {
    try {
      const result = await AdminService.removeStudentFromCourse(req.params.courseId, req.params.studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ========== COURSE LECTURERS ==========

  /**
   * Gets lecturers assigned to a course.
   */
  async getCourseLecturers(req, res, next) {
    try {
      const lecturers = await AdminService.getCourseLecturers(req.params.id);
      res.json({ lecturers });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Gets available lecturers for a course.
   */
  async getAvailableLecturers(req, res, next) {
    try {
      const lecturers = await AdminService.getAvailableLecturers(req.params.id);
      res.json({ lecturers });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Adds a lecturer to a course.
   */
  async addLecturerToCourse(req, res, next) {
    try {
      const result = await AdminService.addLecturerToCourse(req.params.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Removes a lecturer from a course.
   */
  async removeLecturerFromCourse(req, res, next) {
    try {
      const result = await AdminService.removeLecturerFromCourse(req.params.courseId, req.params.lecturerId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ========== CLASSROOMS ==========

  /**
   * Lists classrooms with optional filtering.
   */
  async listClassrooms(req, res, next) {
    try {
      const filters = {
        search: req.query.q,
        exam_id: req.query.exam_id,
      };
      const classrooms = await AdminService.listClassroomsForAdmin(filters);
      res.json({ classrooms });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Creates a new classroom.
   */
  async createClassroom(req, res, next) {
    try {
      const result = await AdminService.createClassroomForAdmin(req.body, req.user?.id);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Updates a classroom.
   */
  async updateClassroom(req, res, next) {
    try {
      const result = await AdminService.updateClassroomForAdmin(req.params.id, req.body, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Deletes a classroom.
   */
  async deleteClassroom(req, res, next) {
    try {
      const result = await AdminService.deleteClassroomForAdmin(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Assigns supervisors to a classroom.
   */
  async assignSupervisors(req, res, next) {
    try {
      const result = await AdminService.assignSupervisorsToClassroom(req.params.id, req.body, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Imports classrooms from an Excel file.
   */
  async importClassrooms(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const result = await AdminService.importClassroomsFromExcel(req.file.buffer, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Gets supervisors available for assignment.
   */
  async getSupervisorsForAssignment(req, res, next) {
    try {
      const supervisors = await AdminService.getSupervisorsForAssignment();
      res.json({ supervisors });
    } catch (err) {
      next(err);
    }
  },
};
