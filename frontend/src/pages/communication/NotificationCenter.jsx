import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, Megaphone, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useCommunicationStore from '../../store/communicationStore';
import { PriorityBadge } from './priorityBadges';
import { useSchoolPlanFeatures } from '../../hooks/useSchoolPlanFeatures';
import useAuthStore from '../../store/authStore';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { feature, ready } = useSchoolPlanFeatures();
  const comm = feature('communication');

  const {
    announcements,
    messages,
    isLoading,
    error,
    fetchAnnouncements,
    fetchMessages,
    fetchUnreadAnnouncementsCount,
    fetchUnreadMessagesCount,
    clearError,
  } = useCommunicationStore();

  useEffect(() => {
    if (comm !== true) return;
    fetchAnnouncements(1, 10, '');
    fetchMessages('inbox', 1, 10);
    fetchUnreadAnnouncementsCount();
    fetchUnreadMessagesCount();
  }, [
    comm,
    fetchAnnouncements,
    fetchMessages,
    fetchUnreadAnnouncementsCount,
    fetchUnreadMessagesCount,
  ]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const inboxPreview = (messages || []).slice(0, 8);

  if (!ready || comm === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!comm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary-600" /> Notification center
            </h1>
          </div>
        </nav>
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="card text-center space-y-4">
            <p className="text-gray-800 font-medium">Announcements and messages are not on your current plan.</p>
            <p className="text-sm text-gray-600">
              Upgrade to Basic or Premium to use the notification center, school announcements, and messaging.
            </p>
            {isAdmin ? (
              <Link to="/settings/plans" className="btn-primary inline-flex">
                View plans
              </Link>
            ) : (
              <p className="text-sm text-gray-600">
                Ask a school administrator if you need this feature enabled.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-600" /> Notification center
          </h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary-600" /> Recent announcements
            </h2>
            <Link to="/announcements" className="text-sm text-primary-600 font-medium">
              View all →
            </Link>
          </div>
          {isLoading && announcements.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">No announcements.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {announcements.map((a) => (
                <li key={a._id} className="py-3">
                  <Link to={`/announcements/${a._id}`} className="block hover:bg-gray-50 -mx-2 px-2 rounded-lg">
                    <div className="flex items-start gap-2">
                      {!a.isRead && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className={`font-medium text-gray-900 ${!a.isRead ? 'font-semibold' : ''}`}>
                          {a.title}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <PriorityBadge priority={a.priority} />
                          <span className="text-xs text-gray-400">
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" /> Inbox
            </h2>
            <Link to="/messages" className="text-sm text-primary-600 font-medium">
              Open messages →
            </Link>
          </div>
          {inboxPreview.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages in inbox.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {inboxPreview.map((m) => {
                const unread = !m.isRead;
                return (
                  <li key={m._id} className="py-3">
                    <Link to={`/messages/${m._id}`} className="block hover:bg-gray-50 -mx-2 px-2 rounded-lg">
                      <div className="flex items-start gap-2">
                        {unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                        <div>
                          <p className={`text-gray-900 ${unread ? 'font-semibold' : ''}`}>
                            {m.senderId?.profile?.name || 'User'}
                            {m.subject && ` — ${m.subject}`}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-1">{m.content}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default NotificationCenter;
