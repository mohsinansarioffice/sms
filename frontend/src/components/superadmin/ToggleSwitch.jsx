import { Loader2 } from "lucide-react";

/**
 * Accessible toggle switch with optional loading overlay (disables interaction while loading).
 */
export default function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  loading = false,
  ariaLabel,
  showStateLabel = true,
}) {
  const isDisabled = disabled || loading;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={loading}
        aria-label={ariaLabel}
        disabled={isDisabled}
        onClick={() => !isDisabled && onCheckedChange(!checked)}
        className={`
          relative inline-flex h-8 w-14 flex-shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
          ${checked ? "bg-primary-600" : "bg-gray-200"}
          ${isDisabled ? "opacity-65 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className="sr-only">{ariaLabel}</span>
        {loading ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/85">
            <Loader2
              className="w-4 h-4 animate-spin text-primary-600"
              aria-hidden
            />
          </span>
        ) : (
          <span
            aria-hidden
            className={`
              pointer-events-none absolute top-0.5 left-1 h-6 w-6 rounded-full bg-white shadow
              transition-transform duration-200 ease-in-out
              ${checked ? "translate-x-[1.5rem]" : "translate-x-0"}
            `}
          />
        )}
      </button>
      {showStateLabel && (
        <span className="text-sm text-gray-600 tabular-nums min-w-[1.75rem]">
          {checked ? "On" : "Off"}
        </span>
      )}
    </div>
  );
}
