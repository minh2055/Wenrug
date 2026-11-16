// Emberfall — hazards: shadow meteors and void wisps.
// Meteors tumble straight down; wisps (from level 2) drift sideways on a
// sine path and glow violet. Both are drawn as jagged dark rocks with a
// hot rim, or as ghostly orbs — no images, all canvas paths.

const TAU = Math.PI * 2;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export class MeteorField {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.meteors = [];
    this.spawnTimer = 0.9;
  }

  reset() {
    this.meteors = [];
    this.spawnTimer = 0.9;
  }

  spawnMeteor(level, speedBase) {
    const r = rand(15, 30);
    const verts = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      verts.push(rand(0.72, 1.15));
    }
    this.meteors.push({
      kind: 'rock',
      x: rand(30, this.width - 30),
      y: -40,
      vy: speedBase * rand(0.85, 1.3),
      r,
      rot: Math.random() * TAU,
      vr: rand(-1.4, 1.4),
      verts,
      hue: Math.random() < 0.5 ? '255, 70, 70' : '190, 90, 255',
    });
  }

  spawnWisp(level, speedBase) {
    this.meteors.push({
      kind: 'wisp',
      x: rand(60, this.width - 60),
      y: -30,
      vy: speedBase * rand(0.55, 0.8),
      r: rand(13, 18),
      phase: Math.random() * TAU,
      drift: rand(50, 120),
      hue: '178, 102, 255',
    });
  }

  // Fixed-position spawn for staged states (screenshots).
  spawnAt(x, y, kind = 'rock', vy = 160) {
    if (kind === 'wisp') {
      this.meteors.push({
        kind: 'wisp', x, y, vy, r: 16,
        phase: Math.random() * TAU, drift: 80, hue: '178, 102, 255',
      });
      return;
    }
    const verts = [];
    for (let i = 0; i < 8; i++) verts.push(rand(0.72, 1.15));
    this.meteors.push({
      kind: 'rock', x, y, vy, r: rand(17, 26),
      rot: Math.random() * TAU, vr: rand(-1, 1), verts, hue: '255, 70, 70',
    });
  }

  update(dt, time, level, spawnInterval, speedBase, wispChance) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = spawnInterval * rand(0.75, 1.25);
      if (Math.random() < wispChance) this.spawnWisp(level, speedBase);
      else this.spawnMeteor(level, speedBase);
    }

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.y += m.vy * dt;
      if (m.kind === 'rock') {
        m.rot += m.vr * dt;
      } else {
        m.x += Math.sin(time * 1.6 + m.phase) * m.drift * dt;
      }
      if (m.y > this.height + 60) this.meteors.splice(i, 1);
    }
  }

  // Returns the meteors touching the player this frame (and removes them).
  checkHits(player) {
    const hits = [];
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      const rr = (m.kind === 'wisp' ? m.r * 0.85 : m.r) + player.r - 5;
      const dx = player.x - m.x;
      const dy = player.y - m.y;
      if (dx * dx + dy * dy < rr * rr) {
        hits.push(m);
        this.meteors.splice(i, 1);
      }
    }
    return hits;
  }

  draw(ctx, time) {
    ctx.save();
    for (const m of this.meteors) {
      if (m.kind === 'rock') {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rot);
        ctx.beginPath();
        for (let i = 0; i < m.verts.length; i++) {
          const a = (i / m.verts.length) * TAU;
          const rr = m.r * m.verts[i];
          const px = Math.cos(a) * rr;
          const py = Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#17102a';
        ctx.fill();
        ctx.strokeStyle = `rgba(${m.hue}, 0.95)`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = `rgb(${m.hue})`;
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(${m.hue}, 0.28)`;
        ctx.beginPath();
        ctx.arc(-m.r * 0.25, -m.r * 0.2, m.r * 0.3, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else {
        // Wisp: layered ghost orbs with a trailing fade.
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 2; k >= 0; k--) {
          const alpha = 0.16 + 0.22 * (2 - k) / 2;
          const rr = m.r * (1 + k * 0.45);
          const g = ctx.createRadialGradient(m.x, m.y - k * 14, 0, m.x, m.y - k * 14, rr);
          g.addColorStop(0, `rgba(${m.hue}, ${alpha})`);
          g.addColorStop(1, `rgba(${m.hue}, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(m.x, m.y - k * 14, rr, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#efe6ff';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 0.45, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.restore();
  }
}
