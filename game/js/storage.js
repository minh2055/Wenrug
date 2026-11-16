// Emberfall — best score persistence (localStorage, guarded for privacy modes).

const BEST_KEY = 'emberfall-best';
const MUTE_KEY = 'emberfall-muted';

export function loadBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(Math.floor(score)));
  } catch {
    // Storage unavailable (private mode, blocked cookies): best score is session-only.
  }
}

export function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Ignore: mute state just won't persist.
  }
}
