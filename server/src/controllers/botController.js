import { BotService } from '../services/botService.js';

export const BotController = {
  async chat(req, res, next) {
    try {
      const { message, role, examId } = req.body;
      const reply = await BotService.getReply(message, role, examId);
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
