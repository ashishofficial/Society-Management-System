import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import societyConfig from '../config/society';
import { listMembersApi, createMemberApi, updateMemberApi } from '../services/memberService';
import { listExpensesApi, createExpenseApi, deleteExpenseApi } from '../services/expenseService';
import { listPaymentsApi, markPaymentPaidApi } from '../services/paymentService';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const normalizeMember = (m) => ({
    id: m._id || m.id,
    flatNumber: m.flatNumber,
    block: (m.flatNumber || '').split('-')[0] || 'A',
    name: m.name,
    phone: m.phone || '',
    email: m.email || '',
    isOwner: m.isOwner ?? true,
    familyMembers: m.familyMembers ?? 1,
    status: m.status || 'active',
    role: m.role || 'Member',
    isCommitteeMember: Boolean(m.isCommitteeMember),
  });

  const normalizeExpense = (e) => ({
    id: e._id || e.id,
    date: e.date,
    category: e.category,
    description: e.description,
    amount: e.amount,
    paidTo: e.paidTo,
    paymentMode: e.paymentMode || 'upi',
    receiptNumber: e.receiptNumber || '',
    addedBy: e.addedBy || 'admin',
  });

  const normalizePayment = (p) => {
    const member = typeof p.memberId === 'object' && p.memberId ? p.memberId : null;
    return {
      id: p._id || p.id,
      memberId: member?._id || p.memberId,
      memberName: member?.name || p.memberName || 'Resident',
      flatNumber: member?.flatNumber || p.flatNumber || '',
      month: p.month,
      amount: p.amount,
      totalDue: p.totalDue ?? p.amount,
      paidAmount: p.paidAmount || 0,
      status: p.status || 'unpaid',
      paidDate: p.paidDate || null,
      paymentMode: p.paymentMode || null,
      transactionRef: p.transactionRef || null,
    };
  };

  const reloadData = async () => {
    if (!localStorage.getItem('auth_token')) return;
    setIsLoading(true);
    setLoadError('');
    try {
      const [m, e, p] = await Promise.all([listMembersApi(), listExpensesApi(), listPaymentsApi()]);
      setMembers((m || []).map(normalizeMember));
      setExpenses((e || []).map(normalizeExpense));
      setPayments((p || []).map(normalizePayment));
    } catch (error) {
      setMembers([]);
      setExpenses([]);
      setPayments([]);
      setLoadError(error?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const addExpense = async (expense) => {
    const created = await createExpenseApi({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      paidTo: expense.paidTo,
      paymentMode: expense.paymentMode || 'upi',
      receiptNumber: expense.receiptNumber || '',
    });
    setExpenses((prev) => [normalizeExpense(created), ...prev]);
    return created;
  };

  const deleteExpense = async (id) => {
    await deleteExpenseApi(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const addMember = async (member) => {
    const created = await createMemberApi({
      flatNumber: member.flatNumber,
      name: member.name,
      phone: member.phone,
      email: member.email,
      isOwner: member.isOwner,
      familyMembers: Number(member.familyMembers || 1),
      status: 'active',
    });
    setMembers((prev) => [...prev, normalizeMember(created)]);
    return created;
  };

  const updateMember = async (id, updates) => {
    const updated = await updateMemberApi(id, updates);
    const normalized = normalizeMember(updated);
    setMembers((prev) => prev.map((m) => (m.id === id ? normalized : m)));
    return updated;
  };

  const markAsPaid = async (paymentId, paymentDetails) => {
    const updated = await markPaymentPaidApi(paymentId, paymentDetails);
    const normalized = normalizePayment(updated);
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, ...normalized } : p)));
    return updated;
  };

  const getPaymentsForMonth = (month) => payments.filter(p => p.month === month);

  const getMonthlyStats = (month) => {
    const monthPayments = getPaymentsForMonth(month);
    const totalDue = monthPayments.length * societyConfig.monthlyMaintenance;
    const totalCollected = monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.paidAmount, 0)
      + monthPayments.filter(p => p.status === 'partial').reduce((s, p) => s + p.paidAmount, 0);
    const totalPending = totalDue - totalCollected;
    const paidCount = monthPayments.filter(p => p.status === 'paid').length;
    const overdueCount = monthPayments.filter(p => p.status === 'overdue').length;
    const unpaidCount = monthPayments.filter(p => p.status === 'unpaid').length;
    const partialCount = monthPayments.filter(p => p.status === 'partial').length;
    const monthExpenses = expenses.filter(e => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);

    return {
      totalDue, totalCollected, totalPending,
      paidCount, overdueCount, unpaidCount, partialCount,
      totalExpenses: monthExpenses,
      netBalance: totalCollected - monthExpenses,
      collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0,
    };
  };

  const getLedgerData = (month) => {
    // Get all unique months from data, sorted ascending
    const allMonths = [...new Set([
      ...payments.map(p => p.month),
      ...expenses.map(e => e.date.substring(0, 7)),
    ])].sort();

    // Opening balance = cumulative net of all prior months
    let openingBalance = 0;
    for (const m of allMonths) {
      if (m >= month) break;
      const mIncome = payments
        .filter(p => p.month === m && (p.status === 'paid' || p.status === 'partial'))
        .reduce((s, p) => s + p.paidAmount, 0);
      const mExpenses = expenses
        .filter(e => e.date.startsWith(m))
        .reduce((s, e) => s + e.amount, 0);
      openingBalance += mIncome - mExpenses;
    }

    // Build transactions for selected month
    const incomeEntries = payments
      .filter(p => p.month === month && (p.status === 'paid' || p.status === 'partial') && p.paidDate)
      .map(p => ({
        id: p.id,
        date: p.paidDate,
        description: `Maintenance - Flat ${p.flatNumber} (${p.memberName})`,
        type: 'income',
        amount: p.paidAmount,
        category: null,
        mode: p.paymentMode,
      }));

    const expenseEntries = expenses
      .filter(e => e.date.startsWith(month))
      .map(e => ({
        id: e.id,
        date: e.date,
        description: e.description,
        type: 'expense',
        amount: e.amount,
        category: e.category,
        mode: e.paymentMode,
      }));

    const transactions = [...incomeEntries, ...expenseEntries].sort((a, b) => a.date.localeCompare(b.date));

    // Compute running balance
    let balance = openingBalance;
    for (const txn of transactions) {
      balance += txn.type === 'income' ? txn.amount : -txn.amount;
      txn.runningBalance = balance;
    }

    const totalIncome = incomeEntries.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenseEntries.reduce((s, t) => s + t.amount, 0);

    return {
      openingBalance,
      transactions,
      totalIncome,
      totalExpenses,
      closingBalance: openingBalance + totalIncome - totalExpenses,
    };
  };

  const getDefaulters = (month) => {
    return payments
      .filter(p => p.month === month && (p.status === 'overdue' || p.status === 'unpaid'))
      .map(p => {
        const member = members.find(m => m.id === p.memberId);
        return { ...p, phone: member?.phone };
      });
  };

  const value = useMemo(() => ({
    members, expenses, payments, isLoading, loadError,
    addExpense, deleteExpense, addMember, updateMember, markAsPaid,
    getPaymentsForMonth, getMonthlyStats, getDefaulters, getLedgerData, reloadData,
  }), [members, expenses, payments, isLoading, loadError]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
