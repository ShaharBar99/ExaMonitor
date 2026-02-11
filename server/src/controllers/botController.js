import { BotService } from '../services/botService.js';

/**
 * Controller for AI Bot interactions.
 */
export const BotController = {
  /**
   * Handles chat messages sent to the bot.
   */
  async chat(req, res, next) {
    try {
      const { message, role, examId , stats} = req.body;
      const reply = await BotService.getReply(message, role, examId, stats);
      res.json({ reply, status: 'success' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Checks the status of the bot service.
   */
  async status(req, res, next) {
    try {
      const status = await BotService.getStatus();
      res.json(status);
    } catch (err) {
      next(err);
    }
  },
};
