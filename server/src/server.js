import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

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

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join', ({ token, userId, companyId }) => {
    if (userId) socket.join(`user:${userId}`);
    if (companyId) socket.join(`company:${companyId}`);
  });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(limiter);
app.use(express.json({ limit: '2mb' }));

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), uploadDir))
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/meta/countries', meta.countries);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/approval-flow', approvalFlowRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/expenses', expenseRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is required');
    process.exit(1);
  }
  await connectDb(process.env.MONGODB_URI);
  httpServer.listen(PORT, () => {
    console.log(`Smart ExpenseFlow API on port ${PORT}`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
