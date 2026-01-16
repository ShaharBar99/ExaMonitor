import { BotService } from '../services/botService.js';

export const BotController = {
  async chat(req, res, next) {
    try {
      const { message, role, examId , stats} = req.body;
      const reply = await BotService.getReply(message, role, examId, stats);
      res.json({ reply, status: 'success' });
    } catch (err) {
      next(err);
    }
  },

  async status(req, res, next) {
    try {
      const status = await BotService.getStatus();
      res.json(status);
    } catch (err) {
      next(err);
    }
  },
};
