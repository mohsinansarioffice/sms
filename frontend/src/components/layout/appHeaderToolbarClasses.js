/** Shared toolbar control styles for AppHeader (icon + label from md; compact on small screens). */
export const APP_HEADER_TOOLBAR_ICON =
  "w-4 h-4 md:w-5 md:h-5 shrink-0";

/** Label text: hidden below md so the bar stays icon-only on phones. */
export const APP_HEADER_TOOLBAR_LABEL =
  "whitespace-nowrap hidden md:inline";

export const APP_HEADER_TOOLBAR_BTN =
  "inline-flex shrink-0 items-center justify-center gap-1 md:gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-2.5 md:py-2 text-xs md:text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2";

export const APP_HEADER_TOOLBAR_BTN_LOGOUT =
  "inline-flex shrink-0 items-center justify-center gap-1 md:gap-2 rounded-lg border border-red-200 bg-white px-2 py-1.5 md:px-2.5 md:py-2 text-xs md:text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white";
