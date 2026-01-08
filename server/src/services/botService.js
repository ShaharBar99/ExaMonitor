const botResponses = [
  'I am a mock bot. I am not very smart.',
  'I am sorry, I cannot help you with that.',
  'Please rephrase your question.',
  'I am currently under development. Please try again later.',
];

export const BotService = {
  async getReply(message, role, examId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const randomReply = botResponses[Math.floor(Math.random() * botResponses.length)];
    return randomReply;
  },

  async getStatus() {
    return { status: 'online', mock: true };
  },
};
