// Emberfall — mouse, keyboard and touch input.
// Mouse position is mapped from the displayed canvas size to the
// 1280x800 game coordinates. Arrow keys / WASD steer the spark;
// Enter starts/restarts, Esc/P pauses, M mutes.

const MOVE_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'KeyA', 'KeyD', 'KeyW', 'KeyS',
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouse = { x: canvas.width / 2, y: canvas.height / 2, active: false, movedAt: 0 };
    this.keys = new Set();
    this.pressHandlers = new Map();
    this.lastControl = 'mouse';
    this._onMouseMove = (e) => this._setMouse(e.clientX, e.clientY);
    this._onMouseDown = (e) => {
      this._setMouse(e.clientX, e.clientY);
      this._fire('mousedown');
    };
    this._onTouch = (e) => {
      const t = e.touches[0];
      if (t) {
        this._setMouse(t.clientX, t.clientY);
        if (e.cancelable) e.preventDefault();
      }
    };
    this._onKeyDown = (e) => {
      if (MOVE_KEYS.has(e.code)) {
        this.lastControl = 'keys';
        e.preventDefault();
      }
      if (e.code === 'Space') e.preventDefault();
      if (!e.repeat) {
        this.keys.add(e.code);
        this._fire(e.code);
      }
    };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onBlur = () => this.keys.clear();
  }

  attach() {
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('touchstart', this._onTouch, { passive: false });
    this.canvas.addEventListener('touchmove', this._onTouch, { passive: false });
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
  }

  _setMouse(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouse.x = (clientX - rect.left) * scaleX;
    this.mouse.y = (clientY - rect.top) * scaleY;
    this.mouse.active = true;
    this.mouse.movedAt = performance.now();
    this.lastControl = 'mouse';
  }

  // Normalized steering vector from held movement keys.
  axis() {
    let x = 0;
    let y = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) x += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  hasMovementKey() {
    for (const code of MOVE_KEYS) if (this.keys.has(code)) return true;
    return false;
  }

  // Register a one-shot handler for a key code (Enter, Escape, KeyP, KeyM)
  // or the pseudo-code 'mousedown'.
  onPress(code, fn) {
    if (!this.pressHandlers.has(code)) this.pressHandlers.set(code, []);
    this.pressHandlers.get(code).push(fn);
  }

  _fire(code) {
    const list = this.pressHandlers.get(code);
    if (list) for (const fn of list) fn();
  }
}
