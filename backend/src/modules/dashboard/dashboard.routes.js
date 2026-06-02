import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { getDashboardSummary } from './dashboard.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/summary', getDashboardSummary);

export default router;
