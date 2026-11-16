// Emberfall — DOM interface: HUD values, screens, banners, buttons.
// The canvas draws the world; this module owns everything drawn in DOM
// so the HUD and menus stay crisp text at any display size.

import { POWERUP_TYPES } from './powerups.js';

export class UI {
  constructor() {
    this.el = {
      hud: document.getElementById('hud'),
      score: document.getElementById('hud-score'),
      best: document.getElementById('hud-best'),
      level: document.getElementById('hud-level'),
      lives: document.getElementById('hud-lives'),
      combo: document.getElementById('hud-combo'),
      power: document.getElementById('hud-power'),
      muteBtn: document.getElementById('mute-btn'),
      banner: document.getElementById('banner'),
      title: document.getElementById('title-screen'),
      titleBest: document.getElementById('title-best'),
      pause: document.getElementById('pause-screen'),
      over: document.getElementById('over-screen'),
      newBest: document.getElementById('new-best'),
      finalScore: document.getElementById('final-score'),
      finalBest: document.getElementById('final-best'),
      finalLevel: document.getElementById('final-level'),
      startBtn: document.getElementById('start-btn'),
      resumeBtn: document.getElementById('resume-btn'),
      restartBtn: document.getElementById('restart-btn'),
    };
    this.bannerTimer = null;
    this.lastComboClass = '';
  }

  showScreen(name) {
    this.el.title.classList.toggle('hidden', name !== 'title');
    this.el.pause.classList.toggle('hidden', name !== 'paused');
    this.el.over.classList.toggle('hidden', name !== 'over');
    this.el.hud.classList.toggle('hidden', name !== 'playing' && name !== 'paused');
  }

  setTitleBest(best) {
    this.el.titleBest.textContent = String(best);
  }

  updateHUD(state) {
    this.el.score.textContent = String(state.score);
    this.el.best.textContent = String(state.best);
    this.el.level.textContent = String(state.level);

    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < state.lives
        ? '<span>&#10084;</span>'
        : '<span class="lost">&#10084;</span>';
    }
    this.el.lives.innerHTML = hearts;

    const comboEl = this.el.combo;
    comboEl.textContent = `COMBO x${state.multiplier}`;
    const cls = state.multiplier >= 5 ? 'max' : state.multiplier >= 3 ? 'hot' : '';
    if (cls !== this.lastComboClass) {
      comboEl.classList.remove('hot', 'max');
      if (cls) comboEl.classList.add(cls);
      this.lastComboClass = cls;
    }

    if (state.powerups.length === 0) {
      this.el.power.innerHTML = '';
    } else {
      this.el.power.innerHTML = state.powerups.map((p) => {
        const def = POWERUP_TYPES[p.type];
        return `<span class="pw-${p.type}">${def.label} ${p.seconds}s</span>`;
      }).join(' &nbsp;');
    }
  }

  setMute(muted) {
    this.el.muteBtn.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  }

  banner(title, sub = '') {
    const el = this.el.banner;
    el.innerHTML = `<div class="banner-title">${title}</div>` +
      (sub ? `<div class="banner-sub">${sub}</div>` : '');
    el.classList.remove('hidden');
    // Restart the CSS animation by forcing a reflow.
    void el.offsetWidth;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => el.classList.add('hidden'), 1850);
  }

  showGameOver(result) {
    this.el.finalScore.textContent = String(result.score);
    this.el.finalBest.textContent = String(result.best);
    this.el.finalLevel.textContent = String(result.level);
    this.el.newBest.classList.toggle('hidden', !result.isNewBest);
  }

  bind(handlers) {
    this.el.startBtn.addEventListener('click', handlers.onStart);
    this.el.resumeBtn.addEventListener('click', handlers.onResume);
    this.el.restartBtn.addEventListener('click', handlers.onRestart);
    this.el.muteBtn.addEventListener('click', handlers.onMute);
  }
}
