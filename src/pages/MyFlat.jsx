import { useState, useMemo } from 'react';
import {
  Home, Wallet, AlertCircle, CheckCircle2, Clock, Plus, MessageSquareWarning, Receipt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { isLiveMode } from '../config/appMode';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatMonthYear, getCurrentMonth } from '../utils/formatDate';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  useGetMySummaryQuery, useGetMyPaymentsQuery, useGetMyComplaintsQuery, useCreateMyComplaintMutation,
} from '../store/apiSlice';

const statusStyles = {
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700', icon: Clock },
  unpaid: { label: 'Unpaid', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

// In demo mode there is no authenticated flat link, so we treat the first resident as "me".
function deriveDemoView(members, payments) {
  const me = members[0];
  if (!me) return { summary: null, payments: [] };
  const myPayments = payments.filter((p) => p.flatNumber === me.flatNumber);
  const month = getCurrentMonth();
  const current = myPayments.find((p) => p.month === month) || null;
  const totalOutstanding = myPayments
    .filter((p) => p.status !== 'paid')
    .reduce((s, p) => s + Math.max((p.totalDue || 0) - (p.paidAmount || 0), 0), 0);
  return {
    summary: {
      flatNumber: me.flatNumber,
      member: { name: me.name, phone: me.phone, email: me.email, isOwner: me.isOwner, familyMembers: me.familyMembers },
      month,
      currentDue: current && {
        month: current.month,
        totalDue: current.totalDue,
        paidAmount: current.paidAmount,
        pendingAmount: Math.max((current.totalDue || 0) - (current.paidAmount || 0), 0),
        status: current.status,
      },
      totalOutstanding,
      openComplaints: 0,
    },
    payments: myPayments,
  };
}

export default function MyFlat() {
  const { user } = useAuth();
  const { members, payments } = useData();
  const { toast, showToast, clearToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject: '', category: '', priority: 'medium', description: '' });

  const live = isLiveMode;
  const { data: summaryLive, isLoading: l1, error: e1 } = useGetMySummaryQuery(undefined, { skip: !live });
  const { data: paymentsLive = [], isLoading: l2 } = useGetMyPaymentsQuery(undefined, { skip: !live });
  const { data: complaintsLive = [], isLoading: l3 } = useGetMyComplaintsQuery(undefined, { skip: !live });
  const [createMyComplaint] = useCreateMyComplaintMutation();

  const demoView = useMemo(() => (live ? null : deriveDemoView(members, payments)), [live, members, payments]);
  const [demoComplaints, setDemoComplaints] = useState([]);

  const summary = live ? summaryLive : demoView?.summary;
  const myPayments = live ? paymentsLive : (demoView?.payments || []);
  const myComplaints = live ? complaintsLive : demoComplaints;
  const loading = live ? (l1 || l2 || l3) : false;
  const error = live ? (e1?.data?.message || '') : '';

  const cards = useMemo(() => {
    const due = summary?.currentDue;
    return [
      {
        label: 'This Month',
        value: due ? formatCurrency(due.pendingAmount) : formatCurrency(0),
        sub: due ? statusStyles[due.status]?.label : 'No dues',
        icon: Wallet,
        tone: due && due.pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600',
      },
      {
        label: 'Total Outstanding',
        value: formatCurrency(summary?.totalOutstanding || 0),
        sub: 'Across all months',
        icon: Receipt,
        tone: (summary?.totalOutstanding || 0) > 0 ? 'text-amber-600' : 'text-emerald-600',
      },
      {
        label: 'Open Complaints',
        value: String(summary?.openComplaints ?? myComplaints.filter((c) => c.status === 'open' || c.status === 'in_progress').length),
        sub: 'Awaiting resolution',
        icon: MessageSquareWarning,
        tone: 'text-gray-900',
      },
    ];
  }, [summary, myComplaints]);

  const submitComplaint = async (e) => {
    e.preventDefault();
    const payload = { subject: form.subject, category: form.category, priority: form.priority, description: form.description };
    const reset = () => {
      setForm({ subject: '', category: '', priority: 'medium', description: '' });
      setShowModal(false);
    };
    if (!live) {
      setDemoComplaints((prev) => [
        { id: `demo-c-${Date.now()}`, ...payload, flat: summary?.flatNumber, status: 'open', date: getCurrentMonth() },
        ...prev,
      ]);
      showToast('success', 'Complaint raised (demo)');
      reset();
      return;
    }
    try {
      await createMyComplaint(payload).unwrap();
      showToast('success', 'Complaint raised');
    } catch (err) {
      showToast('error', err?.data?.message || 'Failed to raise complaint');
    } finally {
      reset();
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading your flat details…</div>;
  }
  if (error) {
    return <div className="py-12 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Flat</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome{user?.name ? `, ${user.name}` : ''} • Flat{' '}
            <span className="font-semibold text-gray-700">{summary?.flatNumber || '-'}</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Raise Complaint
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">{c.label}</p>
                <Icon className="w-4 h-4 text-gray-300" />
              </div>
              <p className={`text-2xl font-bold mt-2 ${c.tone}`}>{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Current dues call-to-action */}
      {summary?.currentDue && summary.currentDue.pendingAmount > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-900">
              {formatCurrency(summary.currentDue.pendingAmount)} due for {formatMonthYear(summary.currentDue.month)}
            </p>
            <p className="text-xs text-blue-700 mt-0.5">Pay before the due date to avoid late fees.</p>
          </div>
          <button
            onClick={() => showToast('success', 'Online payment integration coming soon')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            <Wallet className="w-4 h-4" /> Pay Now
          </button>
        </div>
      )}

      {/* Payment history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">My Payment History</h2>
        </div>
        {myPayments.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No payment records yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Month</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Paid</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Paid On</th>
                </tr>
              </thead>
              <tbody>
                {myPayments.map((p) => {
                  const st = statusStyles[p.status] || statusStyles.unpaid;
                  return (
                    <tr key={p._id || p.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-gray-700">{formatMonthYear(p.month)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatCurrency(p.totalDue)}</td>
                      <td className="px-5 py-3 text-gray-600">{formatCurrency(p.paidAmount)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{p.paidDate ? formatDate(p.paidDate) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My complaints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">My Complaints</h2>
        </div>
        {myComplaints.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            <Home className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No complaints raised yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {myComplaints.map((c) => (
              <li key={c._id || c.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-800">{c.subject}</p>
                  <span className="text-xs text-gray-400 capitalize">{(c.status || 'open').replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Raise complaint modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Raise a Complaint" size="md">
        <form className="space-y-4" onSubmit={submitComplaint}>
          <div>
            <label htmlFor="my-complaint-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input id="my-complaint-subject" type="text" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="Brief description of the issue" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label htmlFor="my-complaint-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="my-complaint-category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select category</option>
              {['Plumbing', 'Electrical', 'Elevator', 'Security', 'Parking', 'Noise', 'Housekeeping', 'Civil', 'Amenities', 'Other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="my-priority" value={p} checked={form.priority === p} onChange={(e) => setForm((q) => ({ ...q, priority: e.target.value }))} className="text-blue-600" />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="my-complaint-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="my-complaint-description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Provide detailed description…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Submit Complaint</button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
