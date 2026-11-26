/**
 * Versioned localStorage persistence with safe JSON parsing and in-memory fallback.
 */

export const STORAGE_KEY = 'roommateFinder:v1';

let memoryFallback = null;

export function getDefaultState() {
  return {
    version: 1,
    profile: {
      name: '',
      email: '',
      course: '',
      year: '2nd Year',
      gender: 'prefer-not',
      genderPreference: 'any',
    },
    answers: {},
    importance: {
      sleep: 4,
      cleanliness: 4,
      study: 3,
      social: 2,
    },
    dealBreakers: [],
    shortlist: [],
    sentRequests: [],
    isDemo: false,
    theme: 'light',
  };
}

function isValidStoredShape(data) {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      typeof data.answers === 'object' &&
      typeof data.profile === 'object'
  );
}

export function loadState() {
  const defaults = getDefaultState();
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return memoryFallback ? { ...defaults, ...memoryFallback } : defaults;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return memoryFallback ? { ...defaults, ...memoryFallback } : defaults;
    }
    const parsed = JSON.parse(raw);
    if (!isValidStoredShape(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return defaults;
    }
    return {
      ...defaults,
      ...parsed,
      profile: { ...defaults.profile, ...(parsed.profile || {}) },
      answers: { ...(parsed.answers || {}) },
      importance: { ...defaults.importance, ...(parsed.importance || {}) },
      dealBreakers: Array.isArray(parsed.dealBreakers) ? parsed.dealBreakers : [],
      shortlist: Array.isArray(parsed.shortlist) ? parsed.shortlist : [],
      sentRequests: Array.isArray(parsed.sentRequests) ? parsed.sentRequests : [],
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    // Corrupted JSON or unavailable storage: safely reset/fall back
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore secondary storage errors
    }
    return memoryFallback ? { ...defaults, ...memoryFallback } : defaults;
  }
}

export function saveState(state) {
  memoryFallback = state;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Fallback remains in memoryFallback
  }
}

export function clearState() {
  memoryFallback = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}
