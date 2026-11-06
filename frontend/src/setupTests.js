// ---------------------------------------------------------------------------
// Global test setup for Vitest (see `setupFiles` in vitest.config.js).
//
// jsdom does not implement the browser APIs that MUI and React Flow rely on, so
// they are polyfilled here once for every test file.
// ---------------------------------------------------------------------------
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// MUI's responsive hooks call window.matchMedia — jsdom leaves it undefined.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// MUI's useMediaQuery / React Flow observe element size — jsdom lacks it.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// App's ScrollToTop calls window.scrollTo on route changes.
if (typeof window !== 'undefined' && !window.scrollTo) {
  window.scrollTo = () => {};
}

// Unmount trees rendered by @testing-library/react between tests.
afterEach(() => {
  cleanup();
});
