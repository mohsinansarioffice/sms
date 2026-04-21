import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useEventStore from '../../store/eventStore';
import useAuthStore from '../../store/authStore';

const EventCalendar = () => {
  const { user } = useAuthStore();
  const { events, fetchEvents, deleteEvent } = useEventStore();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  useEffect(() => {
    fetchEvents({ month, year });
  }, [month, year]);

  const grouped = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = new Date(event.eventDate).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return Array.from(map.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [events]);

  const remove = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    const result = await deleteEvent(id);
    if (result.success) {
      toast.success('Event deleted');
      return;
    }
    toast.error(result.error || 'Failed to delete event');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          {user?.role === 'admin' && (
            <Link to="/events/new" className="btn-primary">
              Add Event
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 inline-flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-primary-600" />
            School Calendar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="input-field" value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {new Date(2025, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <input className="input-field" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>

        <div className="card">
          {!grouped.length ? (
            <p className="text-gray-500 text-center py-10">No events found for selected month.</p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([date, list]) => (
                <div key={date} className="border rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-2">{new Date(date).toDateString()}</p>
                  <div className="space-y-2">
                    {list.map((event) => (
                      <div key={event._id} className="flex items-start justify-between border rounded-lg p-3 bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {event.type} | audience: {event.targetAudience}
                          </p>
                          {event.description ? <p className="text-sm text-gray-600 mt-2">{event.description}</p> : null}
                        </div>
                        {user?.role === 'admin' && (
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                            onClick={() => remove(event._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
