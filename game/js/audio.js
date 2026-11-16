// Emberfall — synthesized sound only (WebAudio, no audio files).
// Every effect is built from oscillators and filtered noise at run time.
// The context is created lazily on the first user gesture, so nothing
// plays (or errors) before the player interacts.

import { loadMuted, saveMuted } from './storage.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
    this.padNodes = null;
    this.muted = loadMuted();
  }

  // Call from a user gesture (click / keypress). Safe to call repeatedly.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.4);
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  setMuted(muted) {
    this.muted = muted;
    saveMuted(muted);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.03);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // --- primitives ---------------------------------------------------------

  tone(freq, dur, type = 'sine', vol = 0.2, delay = 0, slideTo = null) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol = 0.3, delay = 0, filterFreq = 900) {
    if (!this.ready || !this.noiseBuf) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t0);
    filter.frequency.exponentialRampToValueAtTime(120, t0 + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // --- game effects -------------------------------------------------------

  // Collect chime: pitch climbs with the combo tier, so chains feel rewarding.
  chime(comboCount) {
    const steps = Math.min(comboCount, 16);
    const freq = 523.25 * Math.pow(2, steps / 12);
    this.tone(freq, 0.22, 'sine', 0.22);
    this.tone(freq * 2, 0.14, 'sine', 0.07);
  }

  thud() {
    this.noise(0.28, 0.5, 0, 700);
    this.tone(150, 0.3, 'sine', 0.5, 0, 42);
  }

  shieldPop() {
    this.tone(880, 0.16, 'triangle', 0.25);
    this.tone(1318, 0.2, 'sine', 0.15, 0.05);
  }

  arpeggio() {
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((f, i) => this.tone(f, 0.24, 'triangle', 0.2, i * 0.07));
  }

  fanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.tone(f, 0.3, 'square', 0.09, i * 0.09));
    this.tone(1318.51, 0.5, 'triangle', 0.16, 0.38);
  }

  gameOver() {
    const notes = [392, 329.63, 261.63, 196];
    notes.forEach((f, i) => this.tone(f, 0.42, 'sawtooth', 0.1, i * 0.16));
    this.noise(0.5, 0.18, 0.1, 500);
  }

  // --- ambient pad --------------------------------------------------------

  startPad() {
    if (!this.ready || this.padNodes) return;
    try {
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 1.2);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      const oscA = this.ctx.createOscillator();
      oscA.type = 'sine';
      oscA.frequency.value = 55;
      const oscB = this.ctx.createOscillator();
      oscB.type = 'sine';
      oscB.frequency.value = 82.41;
      const oscC = this.ctx.createOscillator();
      oscC.type = 'triangle';
      oscC.frequency.value = 110;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      oscA.connect(filter);
      oscB.connect(filter);
      oscC.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      oscA.start();
      oscB.start();
      oscC.start();
      lfo.start();
      this.padNodes = { gain, oscA, oscB, oscC, lfo };
    } catch {
      this.padNodes = null;
    }
  }

  stopPad() {
    if (!this.padNodes) return;
    const nodes = this.padNodes;
    this.padNodes = null;
    try {
      nodes.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      const stopAt = this.ctx.currentTime + 0.8;
      nodes.oscA.stop(stopAt);
      nodes.oscB.stop(stopAt);
      nodes.oscC.stop(stopAt);
      nodes.lfo.stop(stopAt);
    } catch {
      // Already stopped.
    }
  }
}
