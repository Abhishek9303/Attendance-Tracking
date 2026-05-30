import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import env from './config/env';
import { connectDB } from './config/db';
import socketService from './services/socket';
import { errorHandler } from './middlewares/error';

// Import Routes
import authRoutes from './routes/authRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import adminRoutes from './routes/adminRoutes';

// Import Swagger specifications
import { swaggerDocument } from './swagger/docs';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO instance
socketService.init(httpServer);

// Connect to Database
connectDB();

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles for Swagger documentation UI
}));
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support base64 selfies uploading
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger Documentation API UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Healthcheck Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// App Endpoint Routers
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler boundary
app.use(errorHandler);

// Start server
httpServer.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
  console.log(`📑 Swagger Documentation active at http://localhost:${env.PORT}/api-docs`);
});
