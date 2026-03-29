import { Router } from 'express';
import * as ctrl from '../controllers/expenseController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { uploadReceipt } from '../utils/upload.js';

const r = Router();
r.use(authenticate);

r.post(
  '/',
  uploadReceipt.single('receipt'),
  ctrl.create
);
r.post(
  '/ocr-preview',
  uploadReceipt.single('image'),
  ctrl.ocrPreview
);
r.get('/me', ctrl.mine);
r.get('/pending', ctrl.pendingApprovals);
r.get('/team', ctrl.team);
r.get('/all', ctrl.all);
r.get('/dashboard', ctrl.dashboard);
r.get('/:id', ctrl.getOne);
r.get('/:id/logs', ctrl.logs);
r.post('/:id/act', ctrl.act);
r.post('/:id/override', requireRoles('admin'), ctrl.overrideApprove);
r.post('/:id/escalate', ctrl.escalate);

export default r;
