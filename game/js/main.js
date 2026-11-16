// Emberfall — bootstrap, game loop and state machine.
// States: title -> playing <-> paused -> over -> playing.
// Owns score, lives, level clock, screen shake and the hit flash, and
// wires every module together. Nothing here loads from the network.

import { Player } from './player.js';
import { EmberField } from './embers.js';
import { MeteorField } from './meteors.js';
import { PowerUpField, POWERUP_TYPES } from './powerups.js';
import { ParticleSystem } from './particles.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { levelFor, meteorInterval, meteorSpeed, wispChance, levelSubtitle } from './levels.js';
import { loadBest, saveBest } from './storage.js';
import { applyShot } from './shot.js';

const WIDTH = 1280;
const HEIGHT = 800;
const MAX_LIVES = 3;

export class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.state = 'title';
    this.shotMode = false;
    this.score = 0;
    this.best = loadBest();
    this.lives = MAX_LIVES;
    this.elapsed = 0;
    this.level = 1;
    this.time = 0;
    this.shake = 0;
    this.flash = 0;
    this.lastTs = 0;
    this.flashEl = document.getElementById('flash');

    this.player = new Player(WIDTH, HEIGHT);
    this.embers = new EmberField(WIDTH, HEIGHT);
    this.meteors = new MeteorField(WIDTH, HEIGHT);
    this.powerups = new PowerUpField(WIDTH, HEIGHT);
    this.particles = new ParticleSystem(WIDTH, HEIGHT);
    this.audio = new AudioEngine();
    this.input = new Input(this.canvas);
    this.ui = new UI();

    this.input.attach();
    this.ui.setTitleBest(this.best);
    this.ui.setMute(this.audio.muted);
    this.ui.showScreen('title');
    this.ui.bind({
      onStart: () => this.startGame(),
      onResume: () => this.resume(),
      onRestart: () => this.startGame(),
      onMute: () => this.toggleMute(),
    });
    this.input.onPress('Enter', () => {
      if (this.state === 'title' || this.state === 'over') this.startGame();
      else if (this.state === 'paused') this.resume();
    });
    this.input.onPress('Escape', () => this.togglePause());
    this.input.onPress('KeyP', () => this.togglePause());
    this.input.onPress('KeyM', () => this.toggleMute());
    this.input.onPress('mousedown', () => {
      if (this.state === 'title') this.startGame();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.pause();
    });
  }

  // --- state transitions --------------------------------------------------

  startGame() {
    this.audio.unlock();
    this.score = 0;
    this.lives = MAX_LIVES;
    this.elapsed = 0;
    this.level = 1;
    this.shake = 0;
    this.flash = 0;
    this.player.reset();
    this.embers.reset();
    this.meteors.reset();
    this.powerups.reset();
    this.state = 'playing';
    this.ui.showScreen('playing');
    this.audio.startPad();
    this.ui.updateHUD(this.hudState());
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ui.showScreen('paused');
    this.audio.stopPad();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.showScreen('playing');
    this.audio.unlock();
    this.audio.startPad();
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  toggleMute() {
    this.audio.unlock();
    const muted = this.audio.toggleMute();
    this.ui.setMute(muted);
  }

  gameOver() {
    this.state = 'over';
    const isNewBest = this.score > this.best;
    if (isNewBest) {
      this.best = this.score;
      saveBest(this.best);
    }
    this.audio.gameOver();
    this.audio.stopPad();
    this.ui.showGameOver({ score: this.score, best: this.best, level: this.level, isNewBest });
    this.ui.showScreen('over');
  }

  // --- helpers used by the screenshot staging module ----------------------

  setScore(value) {
    this.score = value;
  }

  setCombo(count, windowSeconds = 2) {
    this.embers.comboCount = count;
    this.embers.comboTimer = windowSeconds;
  }

  setElapsed(seconds) {
    this.elapsed = seconds;
    this.level = levelFor(seconds);
  }

  forceGameOver() {
    this.lives = 0;
    this.gameOver();
  }

  get now() {
    return this.time;
  }

  hudState() {
    return {
      score: this.score,
      best: this.best,
      lives: this.lives,
      level: this.level,
      multiplier: this.embers.multiplier,
      powerups: this.powerups.activeList(this.time),
    };
  }

  // --- gameplay events ----------------------------------------------------

  onEmberCollected(ev) {
    this.score += ev.points;
    this.audio.chime(ev.combo);
    this.particles.burst(ev.x, ev.y, '255, 180, 70', 14, 190);
  }

  onPowerUpCollected(ev) {
    const def = POWERUP_TYPES[ev.type];
    this.audio.arpeggio();
    this.particles.burst(ev.x, ev.y, def.color, 20, 220);
    this.ui.banner(`${def.label} UP`, def.type === 'shield' ? 'One hit absorbed' : def.type === 'slow' ? 'Time crawls for 5s' : 'Embers fly to you for 6s');
  }

  onPlayerHit(meteor) {
    if (this.powerups.hasShield(this.time)) {
      this.powerups.consumeShield();
      this.audio.shieldPop();
      this.particles.ring(this.player.x, this.player.y);
      this.shake = Math.max(this.shake, 6);
      this.flash = Math.max(this.flash, 0.25);
      return;
    }
    this.lives -= 1;
    this.embers.resetCombo();
    this.shake = 16;
    this.flash = 1;
    this.audio.thud();
    this.particles.explosion(this.player.x, this.player.y);
    if (this.lives <= 0) this.gameOver();
  }

  // --- loop ---------------------------------------------------------------

  start() {
    const step = (ts) => {
      const dt = Math.min(0.05, this.lastTs ? (ts - this.lastTs) / 1000 : 0.016);
      this.lastTs = ts;
      this.time += dt;
      this.update(dt);
      this.draw();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  update(dt) {
    // Decay shake and flash in every state.
    this.shake = Math.max(0, this.shake - dt * 34);
    this.flash = Math.max(0, this.flash - dt * 2.2);
    if (this.flashEl) this.flashEl.style.opacity = String(this.flash * 0.9);

    if (this.state === 'title') {
      this.embers.updateAmbient(dt, this.time);
      this.particles.update(dt);
      return;
    }
    if (this.state === 'over') {
      this.particles.update(dt);
      return;
    }
    if (this.state !== 'playing') return;

    this.elapsed += dt;
    const newLevel = levelFor(this.elapsed);
    if (newLevel > this.level) {
      this.level = newLevel;
      this.audio.fanfare();
      this.ui.banner(`LEVEL ${this.level}`, levelSubtitle(this.level));
    }

    const timeScale = this.powerups.timeScale(this.time);
    const worldDt = dt * timeScale;

    this.player.update(dt, this.input);
    if (this.player.trailDue(dt)) {
      this.particles.trail(this.player.x, this.player.y);
    }

    this.embers.update(worldDt, this.time, this.player, this.powerups.isMagnet(this.time), (ev) => this.onEmberCollected(ev));
    this.meteors.update(worldDt, this.time, this.level, meteorInterval(this.level), meteorSpeed(this.level), wispChance(this.level));
    this.powerups.update(worldDt, this.player, this.time, (ev) => this.onPowerUpCollected(ev));
    this.particles.update(dt);

    if (!this.shotMode) {
      const hits = this.meteors.checkHits(this.player);
      for (const hit of hits) {
        this.onPlayerHit(hit);
        if (this.state !== 'playing') break;
      }
    }

    this.ui.updateHUD(this.hudState());
  }

  draw() {
    const ctx = this.ctx;
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, '#0a0626');
    bg.addColorStop(0.55, '#070417');
    bg.addColorStop(1, '#04020d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    if (this.shake > 0.2) {
      ctx.translate((Math.random() * 2 - 1) * this.shake, (Math.random() * 2 - 1) * this.shake);
    }
    this.particles.drawBackground(ctx, this.time);

    if (this.state !== 'title') {
      this.powerups.draw(ctx, this.time);
      this.embers.draw(ctx, this.time);
      this.meteors.draw(ctx, this.time);
      if (this.state !== 'over') {
        this.player.draw(ctx, this.time, this.powerups.hasShield(this.time));
      }
    } else {
      this.embers.draw(ctx, this.time);
    }
    this.particles.draw(ctx);
    ctx.restore();
  }
}

const game = new Game();
applyShot(game);
// Exposed for automated smoke tests (keyboard/mouse play-through checks).
window.__emberfall = game;
game.start();
