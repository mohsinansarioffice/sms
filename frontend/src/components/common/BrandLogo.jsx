import { Link } from 'react-router-dom';
import edvanceLogo from '../../assets/Edvance-logo.png';

/** Landscape full lockup: wide aspect ratio; height-driven scaling keeps tagline legible. */
const ASPECT_WIDTH = 640;
const ASPECT_HEIGHT = 160;

/**
 * @param {'header' | 'auth'} variant
 * @param {string} [linkTo] - if set, logo is wrapped in a link (e.g. "/dashboard")
 */
function BrandLogo({ className = '', variant = 'header', linkTo }) {
  const [sizeClass, objectAlign] =
    variant === 'auth'
      ? [
          // Login/register: prominent; wide lockup needs horizontal space on small screens
          'h-[4.5rem] w-auto min-h-[4.25rem] sm:h-24 sm:min-h-[5.5rem] max-w-[min(100%,24rem)] sm:max-w-[min(100%,30rem)]',
          'object-center',
        ]
      : [
          // Nav: readable tagline, ~4:1 lockup gets proportional width
          'h-10 w-auto min-h-9 sm:h-11 sm:min-h-10 md:h-12 max-w-[min(100%,min(20rem,92vw))] sm:max-w-[min(100%,24rem)] md:max-w-[min(100%,26.5rem)]',
          'object-left object-top',
        ];

  const img = (
    <img
      src={edvanceLogo}
      alt="Edvance"
      width={ASPECT_WIDTH}
      height={ASPECT_HEIGHT}
      className={`object-contain ${objectAlign} ${sizeClass} ${className}`.trim()}
      decoding="async"
    />
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="shrink-0 inline-flex items-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label="Go to dashboard"
      >
        {img}
      </Link>
    );
  }

  return <span className="shrink-0 inline-flex items-center">{img}</span>;
}

export default BrandLogo;
