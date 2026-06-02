import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { createVisitor, deleteVisitor, listVisitors, updateVisitor, updateVisitorStatus } from './visitor.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', listVisitors);
router.post('/', createVisitor);
router.patch('/:id/status', requireRole('admin', 'accountant'), updateVisitorStatus);
router.patch('/:id', requireRole('admin', 'accountant'), updateVisitor);
router.delete('/:id', requireRole('admin'), deleteVisitor);

export default router;
