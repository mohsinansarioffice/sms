import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Inbox, Send, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useCommunicationStore from '../../store/communicationStore';
import useAuthStore from '../../store/authStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const MessageList = () => {
  const { user } = useAuthStore();
  const dashboardPath =
    user?.role === 'parent'
      ? '/parent/dashboard'
      : user?.role === 'student'
        ? '/student/dashboard'
        : '/dashboard';
  const {
    messages,
    total,
    currentPage,
    totalPages,
    messagesListType,
    isLoading,
    error,
    fetchMessages,
    clearError
  } = useCommunicationStore();

  const type = messagesListType || 'inbox';

  useEffect(() => {
    fetchMessages(type, 1);
  }, [type, fetchMessages]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const switchTab = (t) => {
    fetchMessages(t, 1);
  };

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    fetchMessages(type, p);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref={dashboardPath}>
        <AppPageHeaderContext
          backTo={dashboardPath}
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Messages"
        />
      </AppHeader>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <Link to="/messages/compose" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Compose
          </Link>
        </div>
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => switchTab('inbox')}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 -mb-px ${
              type === 'inbox'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Inbox className="w-4 h-4" /> Inbox
          </button>
          <button
            type="button"
            onClick={() => switchTab('sent')}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 -mb-px ${
              type === 'sent'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Send className="w-4 h-4" /> Sent
          </button>
        </div>

        <div className="card">
          {isLoading && messages.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No messages.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {messages.map((m) => {
                const other =
                  type === 'inbox'
                    ? m.senderId
                    : m.recipientId;
                const name = other?.profile?.name || 'User';
                const unread = type === 'inbox' && !m.isRead;
                return (
                  <li key={m._id}>
                    <Link
                      to={`/messages/${m._id}`}
                      className={`block py-4 px-1 -mx-1 rounded-lg hover:bg-gray-50 ${
                        unread ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {unread && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`text-gray-900 ${unread ? 'font-semibold' : ''}`}>
                            {type === 'inbox' ? `From ${name}` : `To ${name}`}
                          </p>
                          {m.subject && <p className="text-sm text-gray-700 font-medium">{m.subject}</p>}
                          <p className="text-sm text-gray-500 line-clamp-2">{m.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                className="btn-secondary"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => goPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({total})
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => goPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageList;
