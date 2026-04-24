import { LogOut, Loader2 } from "lucide-react";
import useAuthStore from "../../store/authStore";

/**
 * Logout with immediate disabled state and spinner. Client session clears in the next task; server revoke is background.
 */
export default function LogoutButton({
  className = "btn-secondary inline-flex items-center gap-2",
  label = "Logout",
  /** e.g. close mobile menu before sign-out */
  onBeforeLogout,
  /** Icon + aria-label only (e.g. compact mobile bar) */
  iconOnly = false,
}) {
  const logout = useAuthStore((s) => s.logout);
  const isLoggingOut = useAuthStore((s) => s.isLoggingOut);

  return (
    <button
      type="button"
      onClick={() => {
        onBeforeLogout?.();
        void logout();
      }}
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
      aria-label={iconOnly ? "Log out" : undefined}
      className={className}
    >
      {isLoggingOut ? (
        <Loader2
          className={`${iconOnly ? "w-5 h-5" : "w-4 h-4"} shrink-0 animate-spin`}
          aria-hidden
        />
      ) : (
        <LogOut
          className={`${iconOnly ? "w-5 h-5" : "w-4 h-4"} shrink-0`}
          aria-hidden
        />
      )}
      {!iconOnly ? label : null}
    </button>
  );
}
