// Emberfall — particle system: twinkling starfield, spark trails,
// collect bursts and hit explosions. All particles are plain canvas
// circles drawn additively; no images anywhere.

const TAU = Math.PI * 2;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export class ParticleSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.particles = [];
    this.stars = [];
    for (let i = 0; i < 110; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: rand(0.5, 1.8),
        phase: Math.random() * TAU,
        speed: rand(0.4, 1.6),
        hue: Math.random() < 0.75 ? 220 : 40,
      });
    }
  }

  add(x, y, vx, vy, life, size, color) {
    if (this.particles.length > 900) this.particles.shift();
    this.particles.push({ x, y, vx, vy, life, maxLife: life, size, color });
  }

  // Small fading trail dot behind the spark.
  trail(x, y, color = '120, 230, 255') {
    this.add(x + rand(-3, 3), y + rand(-3, 3), rand(-14, 14), rand(-14, 14), rand(0.25, 0.45), rand(2, 4.5), color);
  }

  // Warm burst when an ember is collected.
  burst(x, y, color = '255, 180, 70', count = 16, speed = 190) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const v = rand(speed * 0.25, speed);
      this.add(x, y, Math.cos(a) * v, Math.sin(a) * v, rand(0.3, 0.7), rand(2, 5), color);
    }
  }

  // Big mixed burst when the player is hit.
  explosion(x, y) {
    this.burst(x, y, '255, 90, 90', 34, 320);
    this.burst(x, y, '255, 200, 90', 22, 240);
    this.burst(x, y, '190, 140, 255', 14, 170);
  }

  // Soft ring flash when a shield absorbs a hit.
  ring(x, y, color = '77, 227, 255') {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU;
      this.add(x, y, Math.cos(a) * 260, Math.sin(a) * 260, 0.45, 3.5, color);
    }
  }

  update(dt) {
    for (const s of this.stars) s.phase += dt * s.speed;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.6 * dt;
      p.vy *= 1 - 1.6 * dt;
    }
  }

  drawBackground(ctx, time) {
    ctx.save();
    for (const s of this.stars) {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase + time * 0.6));
      ctx.globalAlpha = tw * 0.85;
      ctx.fillStyle = s.hue === 220 ? '#cdd8ff' : '#ffe6b0';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = `rgb(${p.color})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * t), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}
