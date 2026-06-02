import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { createExpense, deleteExpense, listExpenses, updateExpense } from './expense.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', listExpenses);
router.post('/', requireRole('admin', 'accountant'), createExpense);
router.patch('/:id', requireRole('admin', 'accountant'), updateExpense);
router.delete('/:id', requireRole('admin'), deleteExpense);

export default router;
