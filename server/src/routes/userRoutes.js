import { Router } from 'express';
import * as ctrl from '../controllers/userController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const r = Router();
r.use(authenticate);
r.get('/', requireRoles('admin'), ctrl.list);
r.post('/', requireRoles('admin'), ctrl.create);
r.patch('/:id', requireRoles('admin'), ctrl.update);
r.delete('/:id', requireRoles('admin'), ctrl.remove);

export default r;
