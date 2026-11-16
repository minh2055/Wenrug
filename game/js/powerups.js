// Emberfall — power-ups: Shield, Slow and Magnet.
// Items float down slowly; touching one activates it for a few seconds.
// Shield absorbs one hit (or expires after 8s), Slow halves the world's
// speed for 5s, Magnet pulls nearby embers toward the spark for 6s.

const TAU = Math.PI * 2;

export const POWERUP_TYPES = {
  shield: { label: 'SHIELD', color: '77, 227, 255', seconds: 8 },
  slow: { label: 'SLOW', color: '179, 136, 255', seconds: 5 },
  magnet: { label: 'MAGNET', color: '255, 122, 217', seconds: 6 },
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickType() {
  const r = Math.random();
  if (r < 0.36) return 'shield';
  if (r < 0.68) return 'slow';
  return 'magnet';
}

export class PowerUpField {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.items = [];
    this.spawnTimer = 11;
    this.shield = false;
    this.shieldUntil = 0;
    this.slowUntil = 0;
    this.magnetUntil = 0;
  }

  reset() {
    this.items = [];
    this.spawnTimer = 11;
    this.shield = false;
    this.shieldUntil = 0;
    this.slowUntil = 0;
    this.magnetUntil = 0;
  }

  spawn() {
    this.items.push({
      type: pickType(),
      x: rand(40, this.width - 40),
      y: -22,
      vy: rand(55, 75),
      phase: Math.random() * TAU,
    });
  }

  // Fixed-position spawn for staged states (screenshots).
  spawnAt(x, y, type) {
    this.items.push({ type, x, y, vy: 60, phase: Math.random() * TAU });
  }

  activate(type, now) {
    if (type === 'shield') {
      this.shield = true;
      this.shieldUntil = now + POWERUP_TYPES.shield.seconds;
    } else if (type === 'slow') {
      this.slowUntil = now + POWERUP_TYPES.slow.seconds;
    } else if (type === 'magnet') {
      this.magnetUntil = now + POWERUP_TYPES.magnet.seconds;
    }
  }

  hasShield(now) {
    if (this.shield && now > this.shieldUntil) this.shield = false;
    return this.shield;
  }

  isSlow(now) {
    return now < this.slowUntil;
  }

  isMagnet(now) {
    return now < this.magnetUntil;
  }

  timeScale(now) {
    return this.isSlow(now) ? 0.4 : 1;
  }

  consumeShield() {
    this.shield = false;
    this.shieldUntil = 0;
  }

  // Active effects for the HUD, with seconds remaining.
  activeList(now) {
    const list = [];
    if (this.hasShield(now)) {
      list.push({ type: 'shield', seconds: Math.ceil(this.shieldUntil - now) });
    }
    if (this.isSlow(now)) {
      list.push({ type: 'slow', seconds: Math.ceil(this.slowUntil - now) });
    }
    if (this.isMagnet(now)) {
      list.push({ type: 'magnet', seconds: Math.ceil(this.magnetUntil - now) });
    }
    return list;
  }

  update(dt, player, now, onCollect) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = rand(12, 18);
      this.spawn();
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.vy * dt;
      if (item.y > this.height + 30) {
        this.items.splice(i, 1);
        continue;
      }
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const rr = player.r + 20;
      if (dx * dx + dy * dy < rr * rr) {
        this.items.splice(i, 1);
        this.activate(item.type, now);
        onCollect({ type: item.type, x: item.x, y: item.y });
      }
    }
  }

  draw(ctx, time) {
    ctx.save();
    for (const item of this.items) {
      const def = POWERUP_TYPES[item.type];
      const bob = Math.sin(time * 2.4 + item.phase) * 4;
      const y = item.y + bob;
      const pulse = 0.7 + 0.3 * Math.sin(time * 4 + item.phase);
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(item.x, y, 0, item.x, y, 34);
      glow.addColorStop(0, `rgba(${def.color}, ${0.45 * pulse})`);
      glow.addColorStop(1, `rgba(${def.color}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(item.x, y, 34, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(8, 6, 24, 0.9)';
      ctx.strokeStyle = `rgb(${def.color})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = `rgb(${def.color})`;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(item.x, y, 15, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgb(${def.color})`;
      ctx.strokeStyle = `rgb(${def.color})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      if (item.type === 'shield') {
        ctx.beginPath();
        ctx.arc(item.x, y + 1, 8, Math.PI * 0.15, Math.PI * 0.85, true);
        ctx.lineTo(item.x, y + 9);
        ctx.closePath();
        ctx.stroke();
      } else if (item.type === 'slow') {
        ctx.beginPath();
        ctx.arc(item.x, y, 8, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(item.x, y);
        ctx.lineTo(item.x, y - 5);
        ctx.moveTo(item.x, y);
        ctx.lineTo(item.x + 4, y + 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(item.x, y, 7, Math.PI, 0, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(item.x - 7, y);
        ctx.lineTo(item.x - 7, y + 6);
        ctx.moveTo(item.x + 7, y);
        ctx.lineTo(item.x + 7, y + 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
