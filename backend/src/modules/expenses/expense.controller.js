import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Expense } from './expense.model.js';

export const listExpenses = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const filter = month ? { societyId: req.societyId, date: { $regex: `^${month}` } } : { societyId: req.societyId };
  const data = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
  res.json({ data });
});

export const createExpense = asyncHandler(async (req, res) => {
  const { date, category, description, amount, paidTo } = req.body;
  if (!date || !category || !description || typeof amount !== 'number' || !paidTo) {
    throw new ApiError(400, 'date, category, description, amount and paidTo are required');
  }

  const expense = await Expense.create({ ...req.body, societyId: req.societyId, addedBy: req.user.id });
  req.auditEntity = 'expense';
  req.auditAction = 'create';
  req.auditEntityId = expense._id.toString();
  res.status(201).json({ data: expense });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, societyId: req.societyId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!expense) throw new ApiError(404, 'Expense not found');
  req.auditEntity = 'expense';
  req.auditAction = 'update';
  req.auditEntityId = expense._id.toString();
  res.json({ data: expense });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, societyId: req.societyId });
  if (!expense) throw new ApiError(404, 'Expense not found');
  req.auditEntity = 'expense';
  req.auditAction = 'delete';
  req.auditEntityId = expense._id.toString();
  res.status(204).send();
});
