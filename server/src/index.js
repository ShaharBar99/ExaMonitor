import 'dotenv/config';
import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [/^http:\/\/localhost:\d+$/,'https://examonitor-t11n.vercel.app', 'examonitor-vite.vercel.app'],
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('send_message', ({ room, message }) => {
        // We MUST include 'room' in the emitted object so the 
        // global listener knows which tab to update.
        socket.to(room).emit('new_message', { 
            ...message, 
            room: room 
        });
    });

    socket.on('new_incident', (incident) => {
        console.log('New incident received: ', incident);
        socket.broadcast.emit('new_incident_received', incident);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
app.set("trust proxy", true);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

