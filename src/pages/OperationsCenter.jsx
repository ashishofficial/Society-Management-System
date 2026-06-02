import { useEffect, useState } from 'react';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import { isValidFlatNumber } from '../utils/validation';
import {
  createDocumentApi,
  createEmergencyAlertApi,
  createParcelApi,
  createParkingApi,
  createStaffApi,
  listDocumentsApi,
  listEmergencyAlertsApi,
  listParcelsApi,
  listParkingApi,
  listStaffApi,
  markParcelDeliveredApi,
  updateEmergencyStatusApi,
  updateStaffAttendanceApi,
} from '../services/operationsService';

export default function OperationsCenter() {
  const { toast, showToast, clearToast } = useToast();
  const [parking, setParking] = useState([]);
  const [staff, setStaff] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [docs, setDocs] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [slotNumber, setSlotNumber] = useState('');
  const [staffForm, setStaffForm] = useState({ name: '', role: '' });
  const [parcelForm, setParcelForm] = useState({ flat: '', recipientName: '' });
  const [docForm, setDocForm] = useState({ title: '', category: '', url: '' });
  const [alertForm, setAlertForm] = useState({ flat: '', raisedBy: '', type: 'other', notes: '' });
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      const [p, s, pa, d, a] = await Promise.all([
        listParkingApi(),
        listStaffApi(),
        listParcelsApi(),
        listDocumentsApi(),
        listEmergencyAlertsApi(),
      ]);
      setParking(p);
      setStaff(s);
      setParcels(pa);
      setDocs(d);
      setAlerts(a);
    } catch (err) {
      showToast('error', err.message || 'Failed to load operations data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations & Security Center</h1>
        <p className="text-sm text-gray-500 mt-1">Parking, staff, parcel desk, documents and emergency controls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Parking Management</h2>
          {formError && <p className="text-sm text-red-600 mb-2">{formError}</p>}
          <div className="flex gap-2 mb-3">
            <input id="parking-slot-number" aria-label="Parking slot number" value={slotNumber} onChange={(e) => setSlotNumber(e.target.value)} placeholder="Slot number (P-101)" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button
              onClick={async () => {
                if (!slotNumber.trim()) {
                  setFormError('Parking slot number is required');
                  return;
                }
                try {
                  await createParkingApi({ slotNumber });
                  setSlotNumber('');
                  setFormError('');
                  showToast('success', 'Parking slot added');
                  load();
                } catch (err) {
                  showToast('error', err.message || 'Failed to add slot');
                }
              }}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
            >
              Add
            </button>
          </div>
          <ul className="text-sm text-gray-700 space-y-1 max-h-36 overflow-auto">{parking.map((item) => <li key={item._id}>{item.slotNumber} - {item.status}</li>)}</ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Staff & Attendance</h2>
          <div className="flex gap-2 mb-3">
            <input id="staff-name" aria-label="Staff name" value={staffForm.name} onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))} placeholder="Staff name" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <input id="staff-role" aria-label="Staff role" value={staffForm.role} onChange={(e) => setStaffForm((p) => ({ ...p, role: e.target.value }))} placeholder="Role" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button
              onClick={async () => {
                if (!staffForm.name.trim() || !staffForm.role.trim()) {
                  setFormError('Staff name and role are required');
                  return;
                }
                try {
                  await createStaffApi(staffForm);
                  setStaffForm({ name: '', role: '' });
                  setFormError('');
                  showToast('success', 'Staff added');
                  load();
                } catch (err) {
                  showToast('error', err.message || 'Failed to add staff');
                }
              }}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
            >
              Add
            </button>
          </div>
          <ul className="text-sm text-gray-700 space-y-1 max-h-36 overflow-auto">
            {staff.map((item) => (
              <li key={item._id} className="flex items-center justify-between">
                <span>{item.name} ({item.role}) - {item.attendanceStatus}</span>
                <button
                  onClick={async () => {
                    const next = item.attendanceStatus === 'present' ? 'absent' : 'present';
                    await updateStaffAttendanceApi(item._id, { attendanceStatus: next });
                    load();
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 rounded"
                >
                  Toggle
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Parcel Desk</h2>
          <div className="flex gap-2 mb-3">
            <input id="parcel-flat" aria-label="Parcel flat number" value={parcelForm.flat} onChange={(e) => setParcelForm((p) => ({ ...p, flat: e.target.value }))} placeholder="Flat" className="w-28 px-3 py-2 border rounded-lg text-sm" />
            <input id="parcel-recipient" aria-label="Parcel recipient name" value={parcelForm.recipientName} onChange={(e) => setParcelForm((p) => ({ ...p, recipientName: e.target.value }))} placeholder="Recipient name" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button
              onClick={async () => {
                if (!isValidFlatNumber(parcelForm.flat) || !parcelForm.recipientName.trim()) {
                  setFormError('Use flat format like A-101 and enter recipient name');
                  return;
                }
                try {
                  await createParcelApi(parcelForm);
                  setParcelForm({ flat: '', recipientName: '' });
                  setFormError('');
                  load();
                } catch (err) {
                  showToast('error', err.message || 'Failed to add parcel');
                }
              }}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
            >
              Add
            </button>
          </div>
          <ul className="text-sm text-gray-700 space-y-1 max-h-36 overflow-auto">
            {parcels.map((item) => (
              <li key={item._id} className="flex items-center justify-between">
                <span>{item.flat} - {item.recipientName} ({item.status})</span>
                {item.status !== 'delivered' && (
                  <button onClick={async () => { await markParcelDeliveredApi(item._id); load(); }} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    Delivered
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Document Vault</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <input id="doc-title" aria-label="Document title" value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="px-3 py-2 border rounded-lg text-sm" />
            <input id="doc-category" aria-label="Document category" value={docForm.category} onChange={(e) => setDocForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" className="px-3 py-2 border rounded-lg text-sm" />
            <input id="doc-url" aria-label="Document URL" value={docForm.url} onChange={(e) => setDocForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button
            onClick={async () => {
              if (!docForm.title.trim() || !docForm.category.trim() || !/^https?:\/\//i.test(docForm.url)) {
                setFormError('Document title/category and valid URL are required');
                return;
              }
              try {
                await createDocumentApi(docForm);
                setDocForm({ title: '', category: '', url: '' });
                setFormError('');
                load();
              } catch (err) {
                showToast('error', err.message || 'Failed to add document');
              }
            }}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg mb-3"
          >
            Save Document
          </button>
          <ul className="text-sm text-gray-700 space-y-1 max-h-36 overflow-auto">{docs.map((item) => <li key={item._id}>{item.title} - {item.category}</li>)}</ul>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Emergency Alerts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3">
          <input id="alert-flat" aria-label="Alert flat number" value={alertForm.flat} onChange={(e) => setAlertForm((p) => ({ ...p, flat: e.target.value }))} placeholder="Flat" className="px-3 py-2 border rounded-lg text-sm" />
          <input id="alert-raised-by" aria-label="Alert raised by" value={alertForm.raisedBy} onChange={(e) => setAlertForm((p) => ({ ...p, raisedBy: e.target.value }))} placeholder="Raised by" className="px-3 py-2 border rounded-lg text-sm" />
          <select id="alert-type" aria-label="Alert type" value={alertForm.type} onChange={(e) => setAlertForm((p) => ({ ...p, type: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
            <option value="medical">Medical</option><option value="fire">Fire</option><option value="security">Security</option><option value="other">Other</option>
          </select>
          <input id="alert-notes" aria-label="Alert notes" value={alertForm.notes} onChange={(e) => setAlertForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="px-3 py-2 border rounded-lg text-sm sm:col-span-2" />
        </div>
        <button
          onClick={async () => {
            if (!isValidFlatNumber(alertForm.flat) || !alertForm.raisedBy.trim()) {
              setFormError('Use flat format like A-101 and enter raised by name');
              return;
            }
            try {
              await createEmergencyAlertApi(alertForm);
              setAlertForm({ flat: '', raisedBy: '', type: 'other', notes: '' });
              setFormError('');
              load();
            } catch (err) {
              showToast('error', err.message || 'Failed to raise alert');
            }
          }}
          className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg mb-3"
        >
          Raise Alert
        </button>
        <ul className="text-sm text-gray-700 space-y-1">{alerts.map((item) => (
          <li key={item._id} className="flex justify-between">
            <span>{item.flat} - {item.type} - {item.status}</span>
            {item.status !== 'closed' && <button className="text-xs px-2 py-1 bg-yellow-100 rounded" onClick={async () => { await updateEmergencyStatusApi(item._id, { status: 'acknowledged' }); load(); }}>Acknowledge</button>}
          </li>
        ))}</ul>
      </section>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
