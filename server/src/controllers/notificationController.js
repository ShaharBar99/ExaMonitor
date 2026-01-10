import { NotificationService } from '../services/notificationService.js';

export const NotificationController = {
  async get(req, res, next) {
    try {
      const { contextId } = req.query;
      const notifications = await NotificationService.getNotifications(contextId);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  },
};
