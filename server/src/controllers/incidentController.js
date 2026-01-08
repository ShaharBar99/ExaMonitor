import { IncidentService } from '../services/incidentService.js';

export const IncidentController = {
  async report(req, res, next) {
    try {
      const incident = await IncidentService.report(req.body);
      res.status(201).json(incident);
    } catch (err) {
      next(err);
    }
  },

  async callManager(req, res, next) {
    try {
      const { roomId, reason } = req.body;
      const result = await IncidentService.callManager(roomId, reason);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
