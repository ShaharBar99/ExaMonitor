import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
