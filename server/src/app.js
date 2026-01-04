import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import adminRoutes from './routes/adminRoutes.js';
import examRoutes from './routes/examRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';


const app = express();

/**
 * Allow frontend to call backend
 */
app.use(cors({
  origin: true,
  credentials: true,
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
app.use('/attendance', attendanceRoutes);


/** Error handling middleware */
app.use(errorHandler);

export default app;
