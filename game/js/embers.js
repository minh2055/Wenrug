// Emberfall — collectible embers and the combo chain.
// Embers drift down with a gentle sway. Collecting one within 2 seconds
// of the previous collect grows the chain; the multiplier climbs
// x1 -> x2 -> x3 -> x5 and resets when the chain timer runs out or the
// player is hit.

const TAU = Math.PI * 2;
const COMBO_WINDOW = 2.0;
const BASE_POINTS = 10;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function multiplierFor(comboCount) {
  if (comboCount >= 10) return 5;
  if (comboCount >= 6) return 3;
  if (comboCount >= 3) return 2;
  return 1;
}

export class EmberField {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.embers = [];
    this.spawnTimer = 0.2;
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  reset() {
    this.embers = [];
    this.spawnTimer = 0.2;
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  get multiplier() {
    return multiplierFor(this.comboCount);
  }

  get comboFrac() {
    return this.comboCount > 0 ? this.comboTimer / COMBO_WINDOW : 0;
  }

  spawn() {
    this.embers.push({
      x: rand(28, this.width - 28),
      y: -18,
      vy: rand(58, 128),
      swayPhase: Math.random() * TAU,
      swayAmp: rand(12, 42),
      swaySpeed: rand(0.8, 1.8),
      r: rand(9, 13),
      seed: Math.random() * TAU,
    });
  }

  // Fixed-position spawn for staged states (screenshots).
  spawnAt(x, y, vy = 80) {
    this.embers.push({
      x, y, vy,
      swayPhase: Math.random() * TAU,
      swayAmp: rand(12, 30),
      swaySpeed: rand(0.8, 1.6),
      r: rand(10, 13),
      seed: Math.random() * TAU,
    });
  }

  // Ambient drift for the title screen: embers float down with no
  // player to collect them, so the title has a living backdrop.
  updateAmbient(dt, time) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.8;
      this.spawn();
    }
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.y += e.vy * dt;
      e.x += Math.sin(time * e.swaySpeed + e.swayPhase) * e.swayAmp * dt;
      if (e.y > this.height + 24) this.embers.splice(i, 1);
    }
  }

  update(dt, time, player, magnetActive, onCollect) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.55;
      this.spawn();
    }

    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.resetCombo();
    }

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.y += e.vy * dt;
      e.x += Math.sin(time * e.swaySpeed + e.swayPhase) * e.swayAmp * dt;

      if (magnetActive) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d < 280 && d > 1) {
          const pull = 620 * (1 - d / 280) + 160;
          e.x += (dx / d) * pull * dt;
          e.y += (dy / d) * pull * dt;
        }
      }

      if (e.y > this.height + 24) {
        this.embers.splice(i, 1);
        continue;
      }

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const rr = player.r + e.r + 6;
      if (dx * dx + dy * dy < rr * rr) {
        this.embers.splice(i, 1);
        this.comboCount += 1;
        this.comboTimer = COMBO_WINDOW;
        const points = BASE_POINTS * this.multiplier;
        onCollect({ x: e.x, y: e.y, points, combo: this.comboCount, multiplier: this.multiplier });
      }
    }
  }

  draw(ctx, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.embers) {
      const pulse = 0.75 + 0.25 * Math.sin(time * 5 + e.seed);
      const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3.2);
      glow.addColorStop(0, `rgba(255, 200, 90, ${0.5 * pulse})`);
      glow.addColorStop(0.45, 'rgba(255, 140, 40, 0.22)');
      glow.addColorStop(1, 'rgba(255, 120, 20, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 3.2, 0, TAU);
      ctx.fill();

      const core = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
      core.addColorStop(0, '#fff6cf');
      core.addColorStop(0.55, '#ffc44d');
      core.addColorStop(1, '#ff7b00');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * pulse, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
