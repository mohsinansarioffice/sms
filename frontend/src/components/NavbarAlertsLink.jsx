import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useSchoolPlanFeatures } from '../hooks/useSchoolPlanFeatures';

/**
 * Alerts → /notifications; disabled when communication is not on the school's plan.
 */
export default function NavbarAlertsLink({ className = 'btn-secondary flex items-center gap-2' }) {
  const { feature } = useSchoolPlanFeatures();
  const comm = feature('communication');
  if (comm === null) {
    return (
      <span className={`${className} opacity-60 pointer-events-none`} aria-busy="true">
        <Bell className="w-4 h-4" /> Alerts
      </span>
    );
  }
  if (!comm) {
    return (
      <span
        className={`${className} opacity-50 cursor-not-allowed border-dashed`}
        title="Announcements and messages are not included on your current plan. Upgrade in Settings → Plans."
      >
        <Bell className="w-4 h-4" /> Alerts
      </span>
    );
  }
  return (
    <Link to="/notifications" className={className}>
      <Bell className="w-4 h-4" /> Alerts
    </Link>
  );
}
