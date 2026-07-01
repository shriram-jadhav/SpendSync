import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Bell, BellOff, Clock } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../services/scheduler';

const EVENT_COLORS = {
  meeting: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  session: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
  study: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
  work: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  other: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
};

function toLocalInputValue(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Scheduler() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', event_type: 'meeting',
    start_time: '', end_time: '', notify: true, notify_minutes_before: 30,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getEvents();
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingEvent(null);
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setForm({
      title: '', description: '', event_type: 'meeting',
      start_time: toLocalInputValue(now), end_time: toLocalInputValue(later),
      notify: true, notify_minutes_before: 30,
    });
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title, description: event.description || '', event_type: event.event_type,
      start_time: toLocalInputValue(event.start_time), end_time: toLocalInputValue(event.end_time),
      notify: event.notify, notify_minutes_before: event.notify_minutes_before,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, form);
      } else {
        await createEvent(form);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Check that end time is after start time.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    fetchData();
  };

  // Group events by date
  const grouped = events.reduce((acc, ev) => {
    const dateKey = format(parseISO(ev.start_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(ev);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const formatDateLabel = (dateKey) => {
    const date = parseISO(dateKey);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar & Scheduler</h1>
          <p className="text-gray-500 mt-1">Meetings, study sessions, and work blocks</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={18} /> Add Event
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading events...</p>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400">No events scheduled. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">{formatDateLabel(dateKey)}</h3>
              <div className="space-y-2">
                {grouped[dateKey]
                  .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                  .map((ev) => {
                    const colors = EVENT_COLORS[ev.event_type] || EVENT_COLORS.other;
                    return (
                      <div
                        key={ev.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between group hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${colors.dot}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{ev.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} capitalize`}>
                                {ev.event_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1">
                              <Clock size={13} />
                              {format(parseISO(ev.start_time), 'h:mm a')} – {format(parseISO(ev.end_time), 'h:mm a')}
                              {ev.notify && (
                                <span className="flex items-center gap-1 ml-2 text-indigo-500">
                                  <Bell size={13} /> {ev.notify_minutes_before}m before
                                </span>
                              )}
                            </p>
                            {ev.description && <p className="text-sm text-gray-500 mt-1">{ev.description}</p>}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                          <button onClick={() => openEditModal(ev)} className="text-gray-400 hover:text-indigo-600">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(ev.id)} className="text-gray-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? 'Edit Event' : 'Add Event'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. DBMS Study Session"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(EVENT_COLORS).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, event_type: type })}
                  className={`py-2 rounded-lg text-xs font-medium capitalize transition ${
                    form.event_type === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start</label>
              <input
                type="datetime-local" required value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End</label>
              <input
                type="datetime-local" required value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Any extra details..."
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer mb-3">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                {form.notify ? <Bell size={16} className="text-indigo-600" /> : <BellOff size={16} className="text-gray-400" />}
                Email me a reminder
              </span>
              <input
                type="checkbox" checked={form.notify}
                onChange={(e) => setForm({ ...form, notify: e.target.checked })}
                className="w-5 h-5 accent-indigo-600"
              />
            </label>

            {form.notify && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Remind me before</label>
                <select
                  value={form.notify_minutes_before}
                  onChange={(e) => setForm({ ...form, notify_minutes_before: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={1440}>1 day</option>
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition">
            {editingEvent ? 'Update Event' : 'Add Event'}
          </button>
        </form>
      </Modal>
    </Layout>
  );
}