// Created: 2026-09-27
/*
 * Light / dark theme for the dashboard.
 *
 * The choice ('light' | 'dark' | 'system') is kept per browser in
 * localStorage; 'system' follows the device. The resolved theme is stamped
 * on <html data-theme="…"> before the first render (see dashboard/index.js),
 * and src/stylesheets/darkTheme.scss styles everything under
 * html[data-theme="dark"].
 */
const KEY = 'pc-dashboard-theme';
const listeners = new Set();

function stored() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch (_) {
    return 'system';
  }
}

function systemDark() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export function themePreference() {
  return stored();
}

export function resolvedTheme() {
  const pref = stored();
  return pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref;
}

export function applyTheme() {
  const theme = resolvedTheme();
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  listeners.forEach(fn => fn(theme));
}

export function setThemePreference(pref) {
  try {
    if (pref === 'system') {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, pref);
    }
  } catch (_) {
    // Private mode etc.: still applies for this page view.
  }
  applyTheme();
}

// Light → Dark → Match device → Light…
export function cycleTheme() {
  const order = ['light', 'dark', 'system'];
  const next = order[(order.indexOf(stored()) + 1) % order.length];
  setThemePreference(next);
  return next;
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function installTheme() {
  applyTheme();
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const follow = () => {
      if (stored() === 'system') {
        applyTheme();
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', follow);
    } else if (mq.addListener) {
      mq.addListener(follow);
    }
  }
}
