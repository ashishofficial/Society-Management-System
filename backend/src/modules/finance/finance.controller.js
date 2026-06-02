import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { Expense } from '../expenses/expense.model.js';
import { Payment } from '../payments/payment.model.js';
import { BudgetPlan, ReconciliationEntry } from './finance.model.js';

function getFinancialYearMonths(financialYear) {
  const startYear = Number((financialYear || '').split('-')[0]);
  if (Number.isNaN(startYear)) return null;
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(startYear, 3 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

export const createBudget = asyncHandler(async (req, res) => {
  const { financialYear, category, budgetedAmount } = req.body;
  if (!financialYear || !category || typeof budgetedAmount !== 'number') {
    throw new ApiError(400, 'financialYear, category and budgetedAmount are required');
  }
  const data = await BudgetPlan.findOneAndUpdate(
    { societyId: req.societyId, financialYear, category },
    { budgetedAmount },
    { upsert: true, new: true, runValidators: true }
  );
  req.auditEntity = 'budget';
  req.auditAction = 'upsert';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const listBudgets = asyncHandler(async (req, res) => {
  const financialYear = req.query.financialYear;
  const filter = financialYear
    ? { societyId: req.societyId, financialYear }
    : { societyId: req.societyId };
  const data = await BudgetPlan.find(filter).sort({ category: 1 });
  res.json({ data });
});

export const getBudgetVariance = asyncHandler(async (req, res) => {
  const financialYear = req.query.financialYear;
  if (!financialYear) throw new ApiError(400, 'financialYear query is required');

  const budgets = await BudgetPlan.find({ societyId: req.societyId, financialYear });
  const startYear = Number(financialYear.split('-')[0]);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(startYear, 3 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const regex = `^(${months.join('|')})`;
  const expenses = await Expense.find({ societyId: req.societyId, date: { $regex: regex } });

  const actualByCategory = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.amount || 0);
    return acc;
  }, {});

  const data = budgets.map((b) => ({
    category: b.category,
    budgetedAmount: b.budgetedAmount,
    actualAmount: actualByCategory[b.category] || 0,
    variance: b.budgetedAmount - (actualByCategory[b.category] || 0),
  }));
  res.json({ data });
});

export const createReconciliationEntry = asyncHandler(async (req, res) => {
  const { date, reference, amount, type } = req.body;
  if (!date || !reference || typeof amount !== 'number' || !type) {
    throw new ApiError(400, 'date, reference, amount and type are required');
  }
  const data = await ReconciliationEntry.create({ ...req.body, societyId: req.societyId });
  req.auditEntity = 'reconciliation';
  req.auditAction = 'create';
  req.auditEntityId = data._id.toString();
  res.status(201).json({ data });
});

export const listReconciliationEntries = asyncHandler(async (req, res) => {
  const financialYear = req.query.financialYear;
  const filter = { societyId: req.societyId };

  if (financialYear) {
    const months = getFinancialYearMonths(financialYear);
    if (!months) throw new ApiError(400, 'Invalid financialYear format');
    filter.date = { $regex: `^(${months.join('|')})` };
  }

  const data = await ReconciliationEntry.find(filter).sort({ date: -1, createdAt: -1 });
  res.json({ data });
});

export const autoMatchReconciliation = asyncHandler(async (req, res) => {
  const entries = await ReconciliationEntry.find({ societyId: req.societyId, status: 'unmatched' });
  let matched = 0;
  for (const entry of entries) {
    const payment = await Payment.findOne({
      societyId: req.societyId,
      transactionRef: entry.reference,
      paidAmount: entry.amount,
    });
    if (payment) {
      entry.status = 'matched';
      entry.matchedPaymentId = payment._id;
      await entry.save();
      matched += 1;
    }
  }
  req.auditEntity = 'reconciliation';
  req.auditAction = 'auto_match';
  res.json({ data: { processed: entries.length, matched } });
});

export const getComplianceSummary = asyncHandler(async (req, res) => {
  const { month, financialYear } = req.query;
  const filter = { societyId: req.societyId };
  let summaryLabel = '';

  if (month) {
    filter.month = month;
    summaryLabel = month;
  } else if (financialYear) {
    const months = getFinancialYearMonths(financialYear);
    if (!months) throw new ApiError(400, 'Invalid financialYear format');
    filter.month = { $in: months };
    summaryLabel = financialYear;
  } else {
    const currentMonth = new Date().toISOString().slice(0, 7);
    filter.month = currentMonth;
    summaryLabel = currentMonth;
  }

  const payments = await Payment.find(filter);
  const overdueCount = payments.filter((p) => p.status === 'overdue' || p.status === 'unpaid').length;
  const totalDue = payments.reduce((sum, p) => sum + (p.totalDue || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  res.json({
    data: {
      month: summaryLabel,
      overdueCount,
      totalDue,
      totalCollected,
      outstanding: Math.max(totalDue - totalCollected, 0),
      collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0,
    },
  });
});
