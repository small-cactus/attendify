import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Disable browser scroll restoration so back navigation doesn't keep
    // the previous scroll position
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  // Prevent iOS Safari from auto-scrolling focused inputs to the middle
  useEffect(() => {
    const handleFocus = () => {
      const x = window.scrollX;
      const y = window.scrollY;
      requestAnimationFrame(() => {
        window.scrollTo(x, y);
      });
    };
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  return null;
};

export default ScrollToTop;
