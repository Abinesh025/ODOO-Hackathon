import { Router } from 'express';
import * as ctrl from '../controllers/approvalFlowController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const r = Router();
r.use(authenticate);
r.get('/', ctrl.get);
r.put('/', requireRoles('admin'), ctrl.upsert);

export default r;
