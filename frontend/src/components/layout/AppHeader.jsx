import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Settings, Building2, ListChecks } from "lucide-react";
import useAuthStore from "../../store/authStore";
import BrandLogo from "../common/BrandLogo";
import NotificationBell from "../NotificationBell";
import LogoutButton from "../common/LogoutButton";
import {
  APP_HEADER_TOOLBAR_BTN,
  APP_HEADER_TOOLBAR_BTN_LOGOUT,
  APP_HEADER_TOOLBAR_ICON,
  APP_HEADER_TOOLBAR_LABEL,
} from "./appHeaderToolbarClasses";

/** Matches dashboard / settings plan badges */
export const PLAN_BADGE_CLASS = {
  free: "bg-gray-100 text-gray-700 ring-gray-200",
  basic: "bg-primary-100 text-primary-700 ring-primary-200",
  premium: "bg-yellow-100 text-yellow-700 ring-yellow-300",
};

export const APP_HEADER_MAX_WIDTH = "max-w-7xl";

/** Dispatched on `window` when school admin opens Setup guide while already on `/dashboard`. */
export const OPEN_SETUP_GUIDE_EVENT = "sms:open-setup-guide";

function SetupGuideToolbarButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <button
      type="button"
      onClick={() => {
        if (pathname === "/dashboard") {
          window.dispatchEvent(new CustomEvent(OPEN_SETUP_GUIDE_EVENT));
        } else {
          navigate({ pathname: "/dashboard", search: "?setupGuide=1" });
        }
      }}
      className={APP_HEADER_TOOLBAR_BTN}
      aria-label="Setup guide"
      title="Setup guide — review getting-started steps"
    >
      <ListChecks className={APP_HEADER_TOOLBAR_ICON} aria-hidden />
      <span className={APP_HEADER_TOOLBAR_LABEL}>Setup Guide</span>
    </button>
  );
}

export function defaultLogoHref(role) {
  if (role === "superadmin") return "/superadmin/dashboard";
  if (role === "parent") return "/parent/dashboard";
  if (role === "student") return "/student/dashboard";
  return "/dashboard";
}

/**
 * Right toolbar: notification (school roles), optional settings / superadmin schools, logout — icon + label.
 */
function AppHeaderToolbar({ onLogout }) {
  const { user } = useAuthStore();
  const role = user?.role;
  const isSuperAdmin = role === "superadmin";
  const isSchoolAdmin = role === "admin";

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5 md:gap-2 shrink-0 min-w-0">
      {!isSuperAdmin ? (
        <NotificationBell toolbarButtonClassName={APP_HEADER_TOOLBAR_BTN} />
      ) : null}
      {isSchoolAdmin ? <SetupGuideToolbarButton /> : null}
      {isSchoolAdmin ? (
        <Link
          to="/settings/usage"
          className={APP_HEADER_TOOLBAR_BTN}
          aria-label="Settings"
          title="Settings"
        >
          <Settings className={APP_HEADER_TOOLBAR_ICON} aria-hidden />
          <span className={APP_HEADER_TOOLBAR_LABEL}>Settings</span>
        </Link>
      ) : null}
      {isSuperAdmin ? (
        <Link
          to="/superadmin/schools"
          className={APP_HEADER_TOOLBAR_BTN}
          aria-label="Schools"
          title="Manage schools"
        >
          <Building2 className={APP_HEADER_TOOLBAR_ICON} aria-hidden />
          <span className={APP_HEADER_TOOLBAR_LABEL}>Schools</span>
        </Link>
      ) : null}
      <LogoutButton
        label="Logout"
        accessibleLabel="Log out"
        labelClassName={APP_HEADER_TOOLBAR_LABEL}
        className={APP_HEADER_TOOLBAR_BTN_LOGOUT}
        iconClassName={APP_HEADER_TOOLBAR_ICON}
        onBeforeLogout={onLogout}
      />
    </div>
  );
}

/**
 * Shared app header: fixed `max-w-7xl` container, logo left, toolbar (icon + label) right,
 * center slot for dashboard titles or inner-page back + context.
 *
 * @param {object} props
 * @param {string} [props.logoHref] - defaults from role
 * @param {import('react').ReactNode} props.children - center column (titles, back context, etc.)
 * @param {import('react').ReactNode} [props.centerFooter] - optional block below `children` in center column (e.g. parent child select)
 * @param {string} [props.className] - extra classes on `<nav>`
 * @param {() => void} [props.onLogout]
 */
export default function AppHeader({
  logoHref: logoHrefProp,
  children,
  centerFooter = null,
  className = "",
  onLogout,
}) {
  const { user } = useAuthStore();
  const logoHref = logoHrefProp ?? defaultLogoHref(user?.role);

  return (
    <nav className={`bg-white shadow-sm border-b ${className}`.trim()}>
      <div
        className={`${APP_HEADER_MAX_WIDTH} mx-auto px-3 sm:px-4 py-3 sm:py-4`}
      >
        <div className="hidden lg:flex items-start justify-between gap-4 min-w-0">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <BrandLogo linkTo={logoHref} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1 overflow-hidden">
              {children}
              {centerFooter ? (
                <div className="mt-2 min-w-0">{centerFooter}</div>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 pt-0.5 max-w-[min(100%,28rem)]">
            <AppHeaderToolbar onLogout={onLogout} />
          </div>
        </div>

        <div className="lg:hidden space-y-3 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 shrink pt-0.5 max-w-[min(12rem,46vw)] sm:max-w-[min(14rem,42vw)]">
              <BrandLogo
                linkTo={logoHref}
                className="!h-8 !min-h-0 w-auto max-w-full sm:!h-9"
              />
            </div>
            <div className="min-w-0 flex-1 flex justify-end self-start overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
              <AppHeaderToolbar onLogout={onLogout} />
            </div>
          </div>
          <div className="min-w-0">
            {children}
            {centerFooter ? (
              <div className="mt-2 min-w-0">{centerFooter}</div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Inner pages: icon back + title + optional subtitle (school name, section label, etc.)
 */
export function AppPageHeaderContext({
  backTo,
  backLabel = "Go back",
  title,
  subtitle,
}) {
  return (
    <div className="flex items-start gap-1.5 sm:gap-2 min-w-0">
      <Link
        to={backTo}
        className="shrink-0 mt-0.5 inline-flex items-center justify-center rounded-lg p-1 sm:p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label={backLabel}
        title={backLabel}
      >
        <ChevronLeft className="w-5 h-5" aria-hidden />
      </Link>
      <div className="min-w-0 flex-1 pt-0.5">
        <h1
          className="text-[0.9375rem] sm:text-lg lg:text-xl font-bold text-gray-900 leading-snug break-words min-w-0 lg:truncate"
          title={title}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className="text-xs sm:text-sm text-gray-500 mt-0.5 min-w-0 break-words lg:truncate lg:[overflow-wrap:normal]"
            title={subtitle}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
