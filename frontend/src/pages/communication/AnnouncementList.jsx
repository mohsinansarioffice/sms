import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import useCommunicationStore from '../../store/communicationStore';
import useAuthStore from '../../store/authStore';
import { PriorityBadge, AudienceLabel } from './priorityBadges';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const AnnouncementList = () => {
  const { user } = useAuthStore();
  const {
    announcements,
    total,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchAnnouncements,
    clearError
  } = useCommunicationStore();

  const { register, watch } = useForm({ defaultValues: { search: '' } });
  const search = watch('search');

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAnnouncements(1, 20, search || '');
    }, 300);
    return () => clearTimeout(t);
  }, [search, fetchAnnouncements]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const canPost = user?.role === 'admin' || user?.role === 'teacher';
  const homePath =
    user?.role === 'parent'
      ? '/parent/dashboard'
      : user?.role === 'student'
        ? '/student/dashboard'
        : '/dashboard';

  const goPage = useCallback(
    (p) => {
      if (p < 1 || p > totalPages) return;
      fetchAnnouncements(p, 20, search);
    },
    [totalPages, search, fetchAnnouncements]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref={homePath}>
        <AppPageHeaderContext
          backTo={homePath}
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Announcements"
        />
      </AppHeader>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {canPost ? (
          <div className="flex justify-end">
            <Link to="/announcements/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> New
            </Link>
          </div>
        ) : null}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search title or content..."
                className="input-field pl-10"
                {...register('search')}
              />
            </div>
            <p className="text-sm text-gray-500 whitespace-nowrap">
              {total} total
            </p>
          </div>

          {isLoading && announcements.length === 0 ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No announcements yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {announcements.map((a) => (
                <li key={a._id}>
                  <Link
                    to={`/announcements/${a._id}`}
                    className={`block py-4 px-1 -mx-1 rounded-lg hover:bg-gray-50 transition-colors ${
                      !a.isRead ? 'bg-primary-50/40' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {!a.isRead && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" title="Unread" />
                        )}
                        <div>
                          <p className={`font-medium text-gray-900 ${!a.isRead ? 'font-semibold' : ''}`}>
                            {a.isPinned && (
                              <span className="text-xs text-primary-600 mr-2">Pinned</span>
                            )}
                            {a.title}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{a.content}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <PriorityBadge priority={a.priority} />
                            <AudienceLabel audience={a.targetAudience} />
                            <span className="text-xs text-gray-400">
                              {a.createdBy?.profile?.name || 'Staff'} ·{' '}
                              {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
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
                Page {currentPage} of {totalPages}
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

export default AnnouncementList;
