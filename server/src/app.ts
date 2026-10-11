import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database.config';
import { apiRouter } from './routes';
import { globalErrorHandler } from './middleware/error.middleware';
import { HTTP_STATUS } from './constants';
import { sendError } from './utils/apiResponse.util';

const app = express();

// Ensure DB connection for serverless / persistent invocations
let isDbConnected = false;
app.use(async (_req, _res, next) => {
  try {
    if (!isDbConnected) {
      await connectDatabase();
      isDbConnected = true;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Security and CORS configuration - allows Vercel client & localhost
app.use(
  cors({
    origin: (_origin, callback) => {
      // Allow any origin or requests without origin (cURL, tools)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount REST API
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root ping
app.get('/', (_req, res) => {
  res.json({ name: 'CredPulse LMS Backend API', status: 'live' });
});

// Catch-all 404 Route
app.use('*', (req, res) => {
  sendError(
    res,
    `Route '${req.originalUrl}' not found on this server.`,
    undefined,
    HTTP_STATUS.NOT_FOUND
  );
});

// Centralized Error Handling Middleware
app.use(globalErrorHandler);

export default app;
