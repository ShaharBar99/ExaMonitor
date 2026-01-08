export const NotificationService = {
  async getNotifications(contextId) {
    console.log(`Getting notifications for context: ${contextId}`);
    return [
      { id: 1, time: '10:00', message: 'The exam has started', type: 'info' },
      { id: 2, time: '10:45', message: 'Urgent call from room 302', type: 'warning' },
    ];
  },
};
