import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import useCommunicationStore from '../../store/communicationStore';
import useAuthStore from '../../store/authStore';
import { PriorityBadge, AudienceLabel } from './priorityBadges';
import BrandLogo from '../../components/common/BrandLogo';

const AnnouncementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentAnnouncement,
    isLoading,
    error,
    fetchAnnouncement,
    markAnnouncementRead,
    deleteAnnouncement,
    fetchAnnouncementReaders,
    announcementReaders,
    clearError
  } = useCommunicationStore();

  const [showReaders, setShowReaders] = useState(false);
  const [loadingReaders, setLoadingReaders] = useState(false);

  useEffect(() => {
    if (id) fetchAnnouncement(id);
  }, [id, fetchAnnouncement]);

  useEffect(() => {
    if (currentAnnouncement && id && !currentAnnouncement.isRead) {
      markAnnouncementRead(id);
    }
  }, [currentAnnouncement, id, markAnnouncementRead]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDelete = async () => {
    if (!window.confirm('Deactivate this announcement?')) return;
    const res = await deleteAnnouncement(id);
    if (res.success) {
      toast.success('Announcement removed');
      navigate('/announcements');
    } else toast.error(res.error || 'Failed');
  };

  const loadReaders = async () => {
    if (showReaders) {
      setShowReaders(false);
      return;
    }
    setLoadingReaders(true);
    await fetchAnnouncementReaders(id);
    setLoadingReaders(false);
    setShowReaders(true);
  };

  const homePath =
    user?.role === 'parent'
      ? '/parent/dashboard'
      : user?.role === 'student'
        ? '/student/dashboard'
        : '/dashboard';

  const a = currentAnnouncement;
  const creatorId = a?.createdBy?._id || a?.createdBy;
  const canEdit =
    user?.role === 'admin' ||
    (a && creatorId && String(creatorId) === String(user?.id || user?._id));

  if (isLoading && !a) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!a) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <p className="text-gray-600">Announcement not found.</p>
        <Link to="/announcements" className="text-primary-600 mt-4 inline-block">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BrandLogo linkTo={homePath} />
            <button
              type="button"
              onClick={() => navigate('/announcements')}
              className="btn-secondary flex items-center gap-2 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Link to={`/announcements/${id}/edit`} className="btn-secondary flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Edit
              </Link>
              <button type="button" onClick={handleDelete} className="btn-secondary text-red-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-8">
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={a.priority} />
            {a.isPinned && <span className="text-xs font-semibold text-primary-600">Pinned</span>}
            <AudienceLabel audience={a.targetAudience} />
            {!a.isRead && (
              <span className="text-xs font-medium text-primary-600">Unread</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{a.title}</h1>
          <p className="text-sm text-gray-500">
            By {a.createdBy?.profile?.name || 'Staff'} ·{' '}
            {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
            {a.expiryDate && (
              <>
                {' '}
                · Expires {new Date(a.expiryDate).toLocaleDateString()}
              </>
            )}
          </p>
          {a.targetAudience === 'specific_class' && a.targetClasses?.length > 0 && (
            <p className="text-sm text-gray-600">
              Classes:{' '}
              {a.targetClasses.map((c) => c.name || c).join(', ')}
            </p>
          )}
          <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">{a.content}</div>

          {a.attachments?.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Attachments</p>
              <ul className="space-y-2">
                {a.attachments.map((att, i) => (
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

          {canEdit && (
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={loadReaders}
                disabled={loadingReaders}
                className="btn-secondary flex items-center gap-2"
              >
                {loadingReaders ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                {showReaders ? 'Hide read receipts' : 'View read receipts'}
              </button>
              {showReaders && (
                <ul className="mt-3 text-sm text-gray-700 space-y-1">
                  {announcementReaders.length === 0 ? (
                    <li>No reads recorded yet.</li>
                  ) : (
                    announcementReaders.map((r) => (
                      <li key={r._id}>
                        {r.userId?.profile?.name || 'User'} —{' '}
                        {r.readAt ? new Date(r.readAt).toLocaleString() : ''}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export default AnnouncementDetail;
