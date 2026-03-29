import { Router } from 'express';
import * as ctrl from '../controllers/companyController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const r = Router();
r.use(authenticate);
r.get('/', ctrl.get);
r.patch('/', requireRoles('admin'), ctrl.update);

export default r;
