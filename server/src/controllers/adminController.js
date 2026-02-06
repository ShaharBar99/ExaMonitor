import { AdminService } from '../services/adminService.js';

export const AdminController = {
  async listUsers(req, res, next) {
    try {
      const users = await AdminService.listUsers();
      res.json({ users });
    } catch (err) {
      next(err);
    }
  },

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

  async listSecurityAlerts(req, res, next) {
    try {
      const alerts = await AdminService.listSecurityAlerts(req.query.status);
      res.json({ alerts });
    } catch (err) {
      next(err);
    }
  },

  async resolveSecurityAlert(req, res, next) {
    try {
      const result = await AdminService.resolveSecurityAlert(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createUser(req, res, next) {
    try {
      const user = await AdminService.createUser(req.body);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  },

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

  async createExam(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const result = await AdminService.createExam(req.body, adminUserId);
      res.status(201).json({ exam: result });
    } catch (err) {
      next(err);
    }
  },

  async deleteExam(req, res, next) {
    try {
      await AdminService.deleteExam(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      await AdminService.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

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
};
