import { useEffect, useState } from 'react';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  autoMatchReconciliationApi,
  createBudgetApi,
  createReconciliationApi,
  getBudgetVarianceApi,
  getComplianceSummaryApi,
  listBudgetsApi,
  listReconciliationApi,
} from '../services/financeService';
import { formatCurrency } from '../utils/formatCurrency';
import { isPositiveAmount } from '../utils/validation';

export default function FinanceCompliance() {
  const { toast, showToast, clearToast } = useToast();
  const [year, setYear] = useState('2026-2027');
  const [budgets, setBudgets] = useState([]);
  const [variance, setVariance] = useState([]);
  const [recon, setRecon] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ category: '', budgetedAmount: '' });
  const [reconForm, setReconForm] = useState({ date: '', reference: '', amount: '', type: 'credit' });
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const [b, v, r, s] = await Promise.all([
        listBudgetsApi(year),
        getBudgetVarianceApi(year),
        listReconciliationApi(),
        getComplianceSummaryApi(),
      ]);
      setBudgets(b);
      setVariance(v);
      setRecon(r);
      setSummary(s);
    } catch (err) {
      showToast('error', err.message || 'Failed to load finance data');
    }
  };

  useEffect(() => { load(); }, [year]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance & Compliance</h1>
          <p className="text-sm text-gray-500 mt-1">Budgets, variance, reconciliation, audit-ready summary</p>
        </div>
        <input value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" aria-label="Financial year" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Budget Planning</h2>
          {formError && <p className="text-sm text-red-600 mb-2">{formError}</p>}
          <div className="flex gap-2 mb-3">
            <input id="budget-category" aria-label="Budget category" placeholder="Category" value={budgetForm.category} onChange={(e) => setBudgetForm((p) => ({ ...p, category: e.target.value }))} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <input id="budget-amount" aria-label="Budget amount" placeholder="Amount" type="number" value={budgetForm.budgetedAmount} onChange={(e) => setBudgetForm((p) => ({ ...p, budgetedAmount: e.target.value }))} className="w-32 px-3 py-2 border rounded-lg text-sm" />
            <button
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
              onClick={async () => {
                if (!budgetForm.category.trim() || !isPositiveAmount(budgetForm.budgetedAmount)) {
                  setFormError('Budget category and positive amount are required');
                  return;
                }
                try {
                  await createBudgetApi({ financialYear: year, category: budgetForm.category, budgetedAmount: Number(budgetForm.budgetedAmount) });
                  setBudgetForm({ category: '', budgetedAmount: '' });
                  setFormError('');
                  load();
                } catch (err) { showToast('error', err.message || 'Failed to save budget'); }
              }}
            >Save</button>
          </div>
          <ul className="text-sm space-y-1 max-h-40 overflow-auto">{budgets.map((item) => <li key={item._id}>{item.category}: {formatCurrency(item.budgetedAmount)}</li>)}</ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Budget vs Actual</h2>
          <ul className="text-sm space-y-1 max-h-52 overflow-auto">
            {variance.map((item) => (
              <li key={item.category} className="flex justify-between">
                <span>{item.category}</span>
                <span className={item.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(item.actualAmount)} / {formatCurrency(item.budgetedAmount)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Bank Reconciliation</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input id="recon-date" aria-label="Reconciliation date" type="date" value={reconForm.date} onChange={(e) => setReconForm((p) => ({ ...p, date: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input id="recon-reference" aria-label="Reconciliation reference" placeholder="Reference" value={reconForm.reference} onChange={(e) => setReconForm((p) => ({ ...p, reference: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input id="recon-amount" aria-label="Reconciliation amount" placeholder="Amount" type="number" value={reconForm.amount} onChange={(e) => setReconForm((p) => ({ ...p, amount: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <select id="recon-type" aria-label="Reconciliation type" value={reconForm.type} onChange={(e) => setReconForm((p) => ({ ...p, type: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm"><option value="credit">Credit</option><option value="debit">Debit</option></select>
          </div>
          <div className="flex gap-2 mb-3">
            <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg" onClick={async () => {
              if (!reconForm.date || !reconForm.reference.trim() || !isPositiveAmount(reconForm.amount)) {
                setFormError('Reconciliation date, reference and positive amount are required');
                return;
              }
              await createReconciliationApi({ ...reconForm, amount: Number(reconForm.amount) });
              setReconForm({ date: '', reference: '', amount: '', type: 'credit' });
              setFormError('');
              load();
            }}>Add Entry</button>
            <button className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg" onClick={async () => { await autoMatchReconciliationApi(); load(); }}>Auto Match</button>
          </div>
          <ul className="text-sm space-y-1 max-h-40 overflow-auto">{recon.map((item) => <li key={item._id}>{item.reference} - {formatCurrency(item.amount)} - {item.status}</li>)}</ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Compliance Snapshot</h2>
          {summary && (
            <div className="text-sm text-gray-700 space-y-1">
              <p>Month: <b>{summary.month}</b></p>
              <p>Total Due: <b>{formatCurrency(summary.totalDue)}</b></p>
              <p>Collected: <b>{formatCurrency(summary.totalCollected)}</b></p>
              <p>Outstanding: <b>{formatCurrency(summary.outstanding)}</b></p>
              <p>Collection Rate: <b>{summary.collectionRate}%</b></p>
              <p>Overdue Cases: <b>{summary.overdueCount}</b></p>
            </div>
          )}
        </section>
      </div>
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
