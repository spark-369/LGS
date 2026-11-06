import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import circuitRoutes from './routes/circuits.js';
import healthRoutes from './routes/health.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Environment loading.
//
// Load order is deliberate: the nearest .env wins, but every candidate is
// layered so a root-level .env (used by docker-compose) cannot shadow the
// service-local backend/.env during development. dotenv never overwrites an
// already-set variable, so the FIRST file to define a key wins.
//   1. backend/.env      (service-local, highest priority)
//   2. <cwd>/.env        (backend/ when started via `npm run dev`)
//   3. <repo root>/.env  (compose-level fallback)
// ---------------------------------------------------------------------------
for (const envPath of [
  path.join(__dirname, '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '..', '..', '.env'),
]) {
  dotenv.config({ path: envPath });
}

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Add them to backend/.env (see the documented keys in that file).');
  process.exit(1);
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// CORS — CLIENT_URL accepts a comma-separated allow-list.
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / curl / health probes (no Origin header).
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '5mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || '5mb' }));

// ---------------------------------------------------------------------------
// Security headers (no external dependency required).
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Global API ceiling — generous, but bounds abuse.
app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/circuits', circuitRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`API listening on :${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// ---------------------------------------------------------------------------
// Graceful shutdown so Docker restarts never drop in-flight requests.
// ---------------------------------------------------------------------------
const shutdown = async (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

startServer();

export { app };
