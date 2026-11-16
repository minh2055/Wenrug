// Emberfall — the player: a spark of light.
// Steers with the mouse (eased follow) or arrow keys / WASD (direct
// velocity). Keyboard wins while a movement key is held; the mouse
// takes over again as soon as the keys are released.

const TAU = Math.PI * 2;
const SPEED = 560;
const EASE = 13;

export class Player {
  constructor(width, height) {
    this.bounds = { w: width, h: height };
    this.r = 14;
    this.reset();
  }

  reset() {
    this.x = this.bounds.w / 2;
    this.y = this.bounds.h - 140;
    this.vx = 0;
    this.vy = 0;
    this.trailTimer = 0;
  }

  update(dt, input) {
    const axis = input.axis();
    if (axis.x !== 0 || axis.y !== 0) {
      this.vx = axis.x * SPEED;
      this.vy = axis.y * SPEED;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else if (input.mouse.active) {
      const k = Math.min(1, dt * EASE);
      const nx = this.x + (input.mouse.x - this.x) * k;
      const ny = this.y + (input.mouse.y - this.y) * k;
      this.vx = (nx - this.x) / Math.max(dt, 0.001);
      this.vy = (ny - this.y) / Math.max(dt, 0.001);
      this.x = nx;
      this.y = ny;
    } else {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }
    const m = this.r + 6;
    this.x = Math.max(m, Math.min(this.bounds.w - m, this.x));
    this.y = Math.max(m, Math.min(this.bounds.h - m, this.y));
  }

  // Returns true when a trail particle should be spawned this frame.
  trailDue(dt) {
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = 0.018;
      return true;
    }
    return false;
  }

  draw(ctx, time, shielded) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Outer glow.
    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4.2);
    glow.addColorStop(0, 'rgba(120, 230, 255, 0.55)');
    glow.addColorStop(0.4, 'rgba(70, 160, 255, 0.22)');
    glow.addColorStop(1, 'rgba(70, 160, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 4.2, 0, TAU);
    ctx.fill();

    // Bright core with a warm heart.
    const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.55, '#bfefff');
    core.addColorStop(1, 'rgba(80, 180, 255, 0.85)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, TAU);
    ctx.fill();

    // Flickering flame tip.
    const flick = 1 + 0.16 * Math.sin(time * 11) + 0.08 * Math.sin(time * 23);
    ctx.fillStyle = 'rgba(255, 240, 190, 0.9)';
    ctx.beginPath();
    ctx.arc(this.x, this.y - this.r * 0.35, this.r * 0.34 * flick, 0, TAU);
    ctx.fill();

    ctx.restore();

    if (shielded) {
      ctx.save();
      ctx.strokeStyle = 'rgba(77, 227, 255, 0.95)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#4de3ff';
      ctx.shadowBlur = 14;
      ctx.setLineDash([10, 7]);
      ctx.lineDashOffset = -time * 30;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 13, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
}
