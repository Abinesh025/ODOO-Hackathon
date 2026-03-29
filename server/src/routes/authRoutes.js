import { Router } from 'express';
import * as ctrl from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const r = Router();
r.post('/signup', ctrl.signup);
r.post('/login', ctrl.login);
r.get('/me', authenticate, ctrl.me);

export default r;
