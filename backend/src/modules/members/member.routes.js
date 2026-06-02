import { Router } from 'express';
import { createMember, deleteMember, listMembers, updateMember } from './member.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listMembers);
router.post('/', requireRole('admin', 'accountant'), createMember);
router.patch('/:id', requireRole('admin', 'accountant'), updateMember);
router.delete('/:id', requireRole('admin'), deleteMember);

export default router;
