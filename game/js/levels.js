// Emberfall — difficulty scaling over time.
// One level every 25 seconds. Each level makes meteors fall faster and
// spawn more often, and wisps show up more from level 2 on.

export const LEVEL_DURATION = 25;

export function levelFor(elapsedSeconds) {
  return Math.floor(elapsedSeconds / LEVEL_DURATION) + 1;
}

// Seconds between meteor spawns at this level.
export function meteorInterval(level) {
  return Math.max(0.32, 1.05 - (level - 1) * 0.08);
}

// Base fall speed (px/s) for meteors at this level.
export function meteorSpeed(level) {
  return 150 + (level - 1) * 26;
}

// Chance a spawn is a sideways-drifting void wisp instead of a rock.
export function wispChance(level) {
  if (level < 2) return 0;
  return Math.min(0.35, 0.08 * (level - 1));
}

export function levelSubtitle(level) {
  if (level === 2) return 'The void grows hungrier';
  if (level === 3) return 'Meteors rain faster';
  if (level === 4) return 'Wisps drift in from the dark';
  if (level >= 6) return 'Survive the storm';
  return 'Faster. Denser. Darker.';
}
