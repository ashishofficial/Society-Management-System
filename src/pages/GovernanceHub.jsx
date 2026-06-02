import { useEffect, useState } from 'react';
import Toast from '../components/common/Toast';
import { useToast } from '../hooks/useToast';
import {
  closePollApi,
  createAnnouncementApi,
  createEventApi,
  createPollApi,
  escalateComplaintsApi,
  listAnnouncementsApi,
  listEventsApi,
  listPollsApi,
  rsvpEventApi,
  votePollApi,
} from '../services/governanceService';

export default function GovernanceHub() {
  const { toast, showToast, clearToast } = useToast();
  const [polls, setPolls] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [pollForm, setPollForm] = useState({ title: '', options: 'Yes,No' });
  const [eventForm, setEventForm] = useState({ title: '', date: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });

  const load = async () => {
    try {
      const [p, e, a] = await Promise.all([listPollsApi(), listEventsApi(), listAnnouncementsApi()]);
      setPolls(p);
      setEvents(e);
      setAnnouncements(a);
    } catch (err) {
      showToast('error', err.message || 'Failed to load governance data');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Governance Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Polls, events, announcements and complaint escalation</p>
        </div>
        <button className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg" onClick={async () => { const res = await escalateComplaintsApi(); showToast('success', `Escalated: ${res?.escalatedCount || 0}`); }}>
          Escalate Overdue Complaints
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Polls</h2>
          <input placeholder="Poll title" className="w-full px-3 py-2 border rounded-lg text-sm mb-2" value={pollForm.title} onChange={(e) => setPollForm((p) => ({ ...p, title: e.target.value }))} />
          <input placeholder="Options comma separated" className="w-full px-3 py-2 border rounded-lg text-sm mb-2" value={pollForm.options} onChange={(e) => setPollForm((p) => ({ ...p, options: e.target.value }))} />
          <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg mb-3" onClick={async () => { await createPollApi({ title: pollForm.title, options: pollForm.options.split(',').map((s) => s.trim()).filter(Boolean) }); setPollForm({ title: '', options: 'Yes,No' }); load(); }}>
            Create Poll
          </button>
          <ul className="text-sm space-y-2 max-h-64 overflow-auto">
            {polls.map((poll) => (
              <li key={poll._id} className="border rounded-lg p-2">
                <p className="font-medium">{poll.title}</p>
                <div className="flex gap-2 mt-1">
                  {!poll.isClosed && <button className="text-xs px-2 py-1 bg-green-100 rounded" onClick={async () => { await votePollApi(poll._id, { flat: 'A-101', optionIndex: 0 }); load(); }}>Vote Yes</button>}
                  {!poll.isClosed && <button className="text-xs px-2 py-1 bg-gray-100 rounded" onClick={async () => { await closePollApi(poll._id); load(); }}>Close</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Events & RSVP</h2>
          <input placeholder="Event title" className="w-full px-3 py-2 border rounded-lg text-sm mb-2" value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} />
          <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm mb-2" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} />
          <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg mb-3" onClick={async () => { await createEventApi(eventForm); setEventForm({ title: '', date: '' }); load(); }}>
            Create Event
          </button>
          <ul className="text-sm space-y-2 max-h-64 overflow-auto">
            {events.map((event) => (
              <li key={event._id} className="border rounded-lg p-2 flex items-center justify-between">
                <span>{event.title} ({event.date})</span>
                <button className="text-xs px-2 py-1 bg-indigo-100 rounded" onClick={async () => { await rsvpEventApi(event._id, { flat: 'A-101', residentName: 'Resident', status: 'yes' }); load(); }}>
                  RSVP
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Announcements</h2>
          <input placeholder="Title" className="w-full px-3 py-2 border rounded-lg text-sm mb-2" value={announcementForm.title} onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))} />
          <textarea placeholder="Message" className="w-full px-3 py-2 border rounded-lg text-sm mb-2" rows={3} value={announcementForm.message} onChange={(e) => setAnnouncementForm((p) => ({ ...p, message: e.target.value }))} />
          <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg mb-3" onClick={async () => { await createAnnouncementApi(announcementForm); setAnnouncementForm({ title: '', message: '' }); load(); }}>
            Publish
          </button>
          <ul className="text-sm space-y-2 max-h-64 overflow-auto">{announcements.map((item) => <li key={item._id} className="border rounded-lg p-2">{item.title}</li>)}</ul>
        </section>
      </div>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
