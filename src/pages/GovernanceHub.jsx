import { useEffect, useState } from 'react';
import { BellRing, CalendarDays, Megaphone, Vote } from 'lucide-react';
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

  const stats = [
    { label: 'Active Polls', value: polls.filter((p) => !p.isClosed).length, icon: Vote, tone: 'text-blue-700 bg-blue-50' },
    { label: 'Upcoming Events', value: events.length, icon: CalendarDays, tone: 'text-violet-700 bg-violet-50' },
    { label: 'Announcements', value: announcements.length, icon: Megaphone, tone: 'text-amber-700 bg-amber-50' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Governance Hub</h1>
            <p className="text-sm text-slate-200 mt-1">Run polls, publish updates and coordinate society events.</p>
          </div>
          <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors" onClick={async () => { const res = await escalateComplaintsApi(); showToast('success', `Escalated: ${res?.escalatedCount || 0}`); }}>
            Escalate Overdue Complaints
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500 mt-3">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Vote className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Polls</h2>
          </div>
          <input placeholder="Poll title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={pollForm.title} onChange={(e) => setPollForm((p) => ({ ...p, title: e.target.value }))} />
          <input placeholder="Options comma separated" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={pollForm.options} onChange={(e) => setPollForm((p) => ({ ...p, options: e.target.value }))} />
          <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg mb-4 font-medium transition-colors" onClick={async () => { await createPollApi({ title: pollForm.title, options: pollForm.options.split(',').map((s) => s.trim()).filter(Boolean) }); setPollForm({ title: '', options: 'Yes,No' }); load(); }}>
            Create Poll
          </button>
          <ul className="space-y-2 max-h-72 overflow-auto pr-1">
            {polls.map((poll) => (
              <li key={poll._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/70">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{poll.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${poll.isClosed ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                    {poll.isClosed ? 'Closed' : 'Open'}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {!poll.isClosed && <button className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 rounded transition-colors" onClick={async () => { await votePollApi(poll._id, { flat: 'A-101', optionIndex: 0 }); load(); }}>Vote Yes</button>}
                  {!poll.isClosed && <button className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors" onClick={async () => { await closePollApi(poll._id); load(); }}>Close</button>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-violet-600" />
            <h2 className="font-semibold text-gray-900">Events & RSVP</h2>
          </div>
          <input placeholder="Event title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} />
          <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} />
          <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg mb-4 font-medium transition-colors" onClick={async () => { await createEventApi(eventForm); setEventForm({ title: '', date: '' }); load(); }}>
            Create Event
          </button>
          <ul className="space-y-2 max-h-72 overflow-auto pr-1">
            {events.map((event) => (
              <li key={event._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/70 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.date}</p>
                </div>
                <button className="text-xs px-2 py-1 bg-indigo-100 hover:bg-indigo-200 rounded transition-colors" onClick={async () => { await rsvpEventApi(event._id, { flat: 'A-101', residentName: 'Resident', status: 'yes' }); load(); }}>
                  RSVP
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BellRing className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-gray-900">Announcements</h2>
          </div>
          <input placeholder="Title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={announcementForm.title} onChange={(e) => setAnnouncementForm((p) => ({ ...p, title: e.target.value }))} />
          <textarea placeholder="Message" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} value={announcementForm.message} onChange={(e) => setAnnouncementForm((p) => ({ ...p, message: e.target.value }))} />
          <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg mb-4 font-medium transition-colors" onClick={async () => { await createAnnouncementApi(announcementForm); setAnnouncementForm({ title: '', message: '' }); load(); }}>
            Publish
          </button>
          <ul className="space-y-2 max-h-72 overflow-auto pr-1">
            {announcements.map((item) => (
              <li key={item._id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/70">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
