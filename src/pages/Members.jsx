import { useState } from 'react';
import { useData } from '../context/DataContext';
import Modal from '../components/common/Modal';
import DataState from '../components/common/DataState';
import { isValidEmail, isValidFlatNumber, isValidPhone } from '../utils/validation';
import { isLiveMode } from '../config/appMode';
import { createMemberLoginApi } from '../services/memberService';
import { Plus, Search, Users, Phone, Mail, Grid, List, Home, KeyRound, Eye, EyeOff } from 'lucide-react';

const emptyForm = {
  flatNumber: '',
  name: '',
  phone: '',
  email: '',
  isOwner: true,
  familyMembers: 2,
  moveInDate: '',
  createLogin: false,
  loginPassword: '',
};
export default function Members() {
  const { members, addMember, isLoading, loadError, reloadData } = useData();
  const [search, setSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [loginTarget, setLoginTarget] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const openLoginModal = (m) => {
    setLoginTarget(m);
    setLoginPassword('');
    setShowLoginPassword(false);
    setLoginSuccess('');
    setLoginError(m.email ? '' : 'This resident has no email. Add one to their record first.');
  };

  const handleCreateLogin = async (e) => {
    e.preventDefault();
    if (!loginTarget) return;
    if (!isLiveMode) {
      setLoginError('Login creation is only available in live (backend) mode.');
      return;
    }
    if (!loginPassword || loginPassword.length < 8) {
      setLoginError('Password must be at least 8 characters');
      return;
    }
    setLoginBusy(true);
    setLoginError('');
    try {
      const res = await createMemberLoginApi(loginTarget.id, loginPassword);
      setLoginSuccess(`Login ${res?.created ? 'created' : 'updated'} for ${res?.email || loginTarget.email}`);
      setLoginPassword('');
      reloadData?.(); // refresh hasLogin flags
    } catch (err) {
      setLoginError(err?.message || 'Failed to save login');
    } finally {
      setLoginBusy(false);
    }
  };

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.flatNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    const matchBlock = blockFilter === 'All' || m.block === blockFilter;
    return matchSearch && matchBlock;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValidFlatNumber(form.flatNumber)) {
      setFormError('Flat number format should be like A-101');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setFormError('Enter a valid 10-digit Indian phone number');
      return;
    }
    if (!isValidEmail(form.email)) {
      setFormError('Enter a valid email address');
      return;
    }
    if (form.createLogin && (!form.loginPassword || form.loginPassword.length < 8)) {
      setFormError('Login password must be at least 8 characters');
      return;
    }
    try {
      await addMember({
        ...form,
        familyMembers: Number(form.familyMembers || 1),
      });
      setShowModal(false);
      setForm(emptyForm);
      setFormError('');
    } catch (error) {
      setFormError(error?.message || 'Failed to add member');
    }
  };

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents Directory</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} residents found</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, flat, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Block Filter */}
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="All">All Blocks</option>
            <option value="A">Block A</option>
            <option value="B">Block B</option>
            <option value="C">Block C</option>
          </select>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              } transition-colors`}
              title="Table view"
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 ${
                viewMode === 'card'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              } transition-colors`}
              title="Card view"
              aria-label="Card view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Flat No.</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Family Size</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.flatNumber}</td>
                    <td className="px-4 py-3 text-gray-800">{m.name}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${m.phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {m.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.email}</td>
                    <td className="px-4 py-3">
                      {m.isOwner ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Owner
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Tenant
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.familyMembers}</td>
                    <td className="px-4 py-3">
                      {m.isCommitteeMember && m.role !== 'Member' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {m.role}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {m.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openLoginModal(m)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> {m.hasLogin ? 'Update login' : 'Create login'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <DataState
              loading={isLoading}
              error={loadError}
              empty={filtered.length === 0}
              emptyMessage="No residents found matching your filters."
              onRetry={reloadData}
            />
          )}
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-bold text-gray-900">{m.flatNumber.split('-')[1]}</span>
                    <span className="text-sm font-medium text-gray-500">Block {m.block}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mt-1">{m.name}</h3>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {m.isOwner ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Owner
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Tenant
                    </span>
                  )}
                  {m.isCommitteeMember && m.role !== 'Member' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {m.role}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <a href={`tel:${m.phone}`} className="hover:text-blue-600 hover:underline">
                    {m.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{m.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span>{m.familyMembers} family members</span>
                </div>
              </div>
              <button
                onClick={() => openLoginModal(m)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                <KeyRound className="w-3.5 h-3.5" /> {m.hasLogin ? 'Update login' : 'Create login'}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No residents found matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Member" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Flat Number */}
            <div>
              <label htmlFor="member-flat-number" className="block text-sm font-medium text-gray-700 mb-1">Flat Number</label>
              <input
                id="member-flat-number"
                type="text"
                value={form.flatNumber}
                onChange={(e) => updateForm('flatNumber', e.target.value)}
                placeholder="e.g. A-101"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="member-full-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                id="member-full-name"
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Resident name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="member-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                id="member-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder="+91XXXXXXXXXX"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="member-email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Owner / Tenant Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resident Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateForm('isOwner', true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.isOwner
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => updateForm('isOwner', false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  !form.isOwner
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Tenant
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Family Members */}
            <div>
              <label htmlFor="member-family-count" className="block text-sm font-medium text-gray-700 mb-1">Family Members</label>
              <input
                id="member-family-count"
                type="number"
                min="1"
                max="20"
                value={form.familyMembers}
                onChange={(e) => updateForm('familyMembers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Move-in Date */}
            <div>
              <label htmlFor="member-move-in" className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
              <input
                id="member-move-in"
                type="date"
                value={form.moveInDate}
                onChange={(e) => updateForm('moveInDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Optional resident login */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.createLogin}
                onChange={(e) => updateForm('createLogin', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Create a login for this resident
            </label>
            {form.createLogin && (
              <div className="mt-3">
                <label htmlFor="member-login-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Login Password
                </label>
                <div className="relative">
                  <input
                    id="member-login-password"
                    type={showFormPassword ? 'text' : 'password'}
                    value={form.loginPassword}
                    onChange={(e) => updateForm('loginPassword', e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showFormPassword ? 'Hide password' : 'Show password'}
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  The resident signs in with their email{form.email ? ` (${form.email})` : ''} and this password.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Create login for an existing member */}
      <Modal isOpen={!!loginTarget} onClose={() => setLoginTarget(null)} title={loginTarget?.hasLogin ? 'Update Resident Login' : 'Create Resident Login'} size="sm">
        {loginSuccess ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700 font-medium">{loginSuccess}</p>
            <p className="text-xs text-gray-500">
              They can now sign in with their email and the password you set.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setLoginTarget(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateLogin} className="space-y-4">
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>Flat: <span className="font-medium text-gray-900">{loginTarget?.flatNumber}</span></p>
              <p>Email: <span className="font-medium text-gray-900">{loginTarget?.email || '—'}</span></p>
            </div>
            {loginTarget?.hasLogin && (
              <p className="text-xs text-amber-600">This resident already has a login. Setting a password will reset it.</p>
            )}
            <div>
              <label htmlFor="resident-login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="resident-login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLoginTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loginBusy || !loginTarget?.email}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
              >
                {loginBusy
                  ? (loginTarget?.hasLogin ? 'Updating…' : 'Creating…')
                  : (loginTarget?.hasLogin ? 'Update Login' : 'Create Login')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
