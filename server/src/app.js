/**
 * @fileoverview Express application setup. Configures middleware and routes.
 */
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import adminRoutes from './routes/adminRoutes.js';
import examRoutes from './routes/examRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import studentRoutes from "./routes/studentRoutes.js";
import attendanceRoutes from './routes/attendanceRoutes.js';
import botRoutes from './routes/botRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';


const app = express();

const allowedOriginPrefix = 'https://examonitor-t11n';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith(allowedOriginPrefix) || origin.startsWith('http://localhost') || origin.startsWith('https://examonitor-vite')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
/**
 * Parse JSON bodies
 */
app.use(express.json());

/** Auth routes*/
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/exams', examRoutes);
app.use('/classrooms', classroomRoutes);
app.use("/api/student", studentRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/bot', botRoutes);
app.use('/incidents', incidentRoutes);
app.use('/notifications', notificationRoutes);


/** Error handling middleware */
app.use(errorHandler);

export default app;
