import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { connectDb } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import approvalFlowRoutes from './routes/approvalFlowRoutes.js';
import ruleRoutes from './routes/ruleRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import * as meta from './controllers/metaController.js';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.set('strict routing', false);
const httpServer = createServer(app);

// ✅ Trust proxy (important for Render / Railway)
app.set('trust proxy', 1);

// ✅ CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://odoo-hackathon-mu.vercel.app',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://odoo.serveftp.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ✅ Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ✅ Rate Limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ✅ Body Parser
app.use(express.json({ limit: '2mb' }));

// ✅ Static Uploads
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));

// ✅ Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);
  socket.on('join', ({ userId, companyId }) => {
    if (userId) socket.join(`user:${userId}`);
    if (companyId) socket.join(`company:${companyId}`);
  });
});

// ✅ Health Check
app.get('/', (_req, res) => {
  res.send('Smart ExpenseFlow API is running 🚀');
});

app.get(['/api/health', '/api/health/'], (_req, res) => {
  res.json({ ok: true });
});

// ✅ Meta Routes
app.get('/api/meta/countries', meta.countries);

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/approval-flow', approvalFlowRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/expenses', expenseRoutes);

// ❌ No frontend serving (since frontend is deployed separately)

// ✅ Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// ✅ Server Start
const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is required');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is required');
    process.exit(1);
  }

  await connectDb(process.env.MONGODB_URI);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Smart ExpenseFlow API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});