import { LogOut, Loader2 } from "lucide-react";
import useAuthStore from "../../store/authStore";

/**
 * Logout with immediate disabled state and spinner. Client session clears in the next task; server revoke is background.
 */
export default function LogoutButton({
  className = "btn-secondary inline-flex items-center gap-2",
  label = "Logout",
  /** e.g. when label is `hidden` on small screens — keeps name in SR + tooltip */
  accessibleLabel,
  /** Classes for the label span (e.g. responsive visibility) */
  labelClassName,
  /** Override icon/spinner size classes */
  iconClassName,
  /** e.g. close mobile menu before sign-out */
  onBeforeLogout,
  /** Icon + aria-label only (e.g. compact mobile bar) */
  iconOnly = false,
}) {
  const logout = useAuthStore((s) => s.logout);
  const isLoggingOut = useAuthStore((s) => s.isLoggingOut);
  const iconCls = iconClassName ?? "w-5 h-5 shrink-0";

  return (
    <button
      type="button"
      onClick={() => {
        onBeforeLogout?.();
        void logout();
      }}
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
      aria-label={accessibleLabel ?? (iconOnly ? label : undefined)}
      title={accessibleLabel ?? label}
      className={className}
    >
      {isLoggingOut ? (
        <Loader2 className={`${iconCls} animate-spin`} aria-hidden />
      ) : (
        <LogOut className={iconCls} aria-hidden />
      )}
      {!iconOnly ? (
        <span className={labelClassName ?? "whitespace-nowrap"}>
          {label}
        </span>
      ) : null}
    </button>
  );
}
