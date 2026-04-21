import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Megaphone, Mail, ChevronRight, Loader2 } from 'lucide-react';
import useCommunicationStore from '../store/communicationStore';
import { useSchoolPlanFeatures } from '../hooks/useSchoolPlanFeatures';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { feature } = useSchoolPlanFeatures();
  const communicationOn = feature('communication');

  const {
    announcements,
    messages,
    unreadAnnouncementsCount,
    unreadMessagesCount,
    fetchUnreadAnnouncementsCount,
    fetchUnreadMessagesCount,
    fetchAnnouncements,
    fetchMessages,
  } = useCommunicationStore();

  const totalUnread = (unreadAnnouncementsCount || 0) + (unreadMessagesCount || 0);
  const canUseComm = communicationOn === true;

  useEffect(() => {
    if (!canUseComm) return;
    fetchUnreadAnnouncementsCount();
    fetchUnreadMessagesCount();
  }, [canUseComm, fetchUnreadAnnouncementsCount, fetchUnreadMessagesCount]);

  useEffect(() => {
    if (!canUseComm || !open) return;
    fetchAnnouncements(1, 5, '');
    fetchMessages('inbox', 1, 5);
  }, [open, canUseComm, fetchAnnouncements, fetchMessages]);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    if (!canUseComm && open) setOpen(false);
  }, [canUseComm, open]);

  const preview = (announcements || []).slice(0, 4);
  const inboxPreview = (messages || []).slice(0, 4);

  if (communicationOn === null) {
    return (
      <div className="relative p-2 rounded-lg text-gray-400" aria-hidden title="Loading plan…">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!communicationOn) {
    return (
      <div className="relative">
        <button
          type="button"
          disabled
          className="relative p-2 rounded-lg text-gray-400 cursor-not-allowed opacity-60"
          title="Announcements and messages are not on your current plan. Open Settings → Plans to upgrade."
          aria-label="Notifications not available on plan"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            <Link
              to="/notifications"
              className="text-xs text-primary-600 font-medium flex items-center gap-0.5"
              onClick={() => setOpen(false)}
            >
              Center <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Megaphone className="w-3 h-3" /> Announcements
            </div>
            {preview.length === 0 ? (
              <p className="px-4 pb-2 text-sm text-gray-500">No recent announcements</p>
            ) : (
              <ul className="pb-2">
                {preview.map((a) => (
                  <li key={a._id}>
                    <Link
                      to={`/announcements/${a._id}`}
                      className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                      onClick={() => setOpen(false)}
                    >
                      <span className={!a.isRead ? 'font-semibold' : ''}>{a.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 border-t border-gray-100">
              <Mail className="w-3 h-3" /> Inbox
            </div>
            {inboxPreview.length === 0 ? (
              <p className="px-4 pb-3 text-sm text-gray-500">No messages</p>
            ) : (
              <ul className="pb-3">
                {inboxPreview.map((m) => (
                  <li key={m._id}>
                    <Link
                      to={`/messages/${m._id}`}
                      className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                      onClick={() => setOpen(false)}
                    >
                      <span className={!m.isRead ? 'font-semibold' : ''}>
                        {m.senderId?.profile?.name || 'Message'}
                      </span>
                      <span className="block text-xs text-gray-500 line-clamp-1">{m.content}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
            <Link
              to="/announcements"
              className="text-xs text-primary-600 font-medium"
              onClick={() => setOpen(false)}
            >
              All announcements
            </Link>
            <span className="text-gray-300 mx-2">·</span>
            <Link
              to="/messages"
              className="text-xs text-primary-600 font-medium"
              onClick={() => setOpen(false)}
            >
              All messages
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
