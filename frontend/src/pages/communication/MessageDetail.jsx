import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import useCommunicationStore from '../../store/communicationStore';
import useAuthStore from '../../store/authStore';

const MessageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentMessage,
    isLoading,
    error,
    fetchMessage,
    deleteMessage,
    clearError
  } = useCommunicationStore();

  useEffect(() => {
    if (id) fetchMessage(id);
  }, [id, fetchMessage]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDelete = async () => {
    if (!window.confirm('Remove this message from your view?')) return;
    const res = await deleteMessage(id);
    if (res.success) {
      toast.success('Message deleted');
      navigate('/messages');
    } else toast.error(res.error || 'Failed');
  };

  const m = currentMessage;
  const uid = user?.id || user?._id;
  const senderId = m?.senderId?._id || m?.senderId;
  const recipientId = m?.recipientId?._id || m?.recipientId;
  const isRecipient = m && String(recipientId) === String(uid);

  if (isLoading && !m) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!m) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <p className="text-gray-600">Message not found.</p>
        <Link to="/messages" className="text-primary-600 mt-4 inline-block">
          Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate('/messages')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-secondary text-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-8">
        <div className="card space-y-4">
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>From:</strong> {m.senderId?.profile?.name || '—'} ({m.senderId?.email || '—'})
            </p>
            <p>
              <strong>To:</strong> {m.recipientId?.profile?.name || '—'} ({m.recipientId?.email || '—'})
            </p>
            <p className="text-xs text-gray-400">
              {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
              {isRecipient && m.isRead && m.readAt && (
                <> · Read {new Date(m.readAt).toLocaleString()}</>
              )}
            </p>
          </div>
          {m.subject && <h1 className="text-xl font-bold text-gray-900">{m.subject}</h1>}
          <div className="whitespace-pre-wrap text-gray-800">{m.content}</div>

          {m.attachments?.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Attachments</p>
              <ul className="space-y-2">
                {m.attachments.map((att, i) => (
                  <li key={i}>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline inline-flex items-center gap-1"
                    >
                      {att.name || 'File'} <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export default MessageDetail;
