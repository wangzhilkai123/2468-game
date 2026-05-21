class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  play(type) {
    if (!this.enabled) return;
    try {
      const ctx = this._ensure();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.value = 300;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'merge') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'win') {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 523;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        osc2.type = 'sine';
        osc2.frequency.value = 784;
        gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.4);
      }
    } catch(e) {}
  }
}

class GameState {
  constructor(size = 4) {
    this.size = size;
    this.score = 0;
    this.best = parseInt(localStorage.getItem('best2468') || '0');
    this.won = false;
    this.over = false;
    this.grid = [];
    this.history = [];
    this.audio = new AudioEngine();

    const saved = this._loadGame();
    if (saved) {
      this.grid = saved.grid;
      this.score = saved.score;
      this.won = saved.won;
      this.over = saved.over;
      this.size = saved.size;
    } else {
      this.init();
    }
  }

  init() {
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.score = 0;
    this.won = false;
    this.over = false;
    this.history = [];
    this.spawn();
    this.spawn();
    this._saveGame();
  }

  spawn() {
    const empty = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  move(direction) {
    const snapshot = {
      grid: this.grid.map(row => [...row]),
      score: this.score,
      won: this.won,
      over: this.over
    };

    const oldGrid = this.grid.map(row => [...row]);
    let moved = false;
    const merges = [];

    if (direction === 'left') {
      for (let r = 0; r < this.size; r++) {
        const result = this._mergeLine(this.grid[r], r, 'row');
        if (result.changed) moved = true;
        this.grid[r] = result.line;
        merges.push(...result.merges);
      }
    } else if (direction === 'right') {
      for (let r = 0; r < this.size; r++) {
        const reversed = [...this.grid[r]].reverse();
        const result = this._mergeLine(reversed, r, 'row_rev');
        if (result.changed) moved = true;
        this.grid[r] = result.line.reverse();
        merges.push(...result.merges.map(m => ({ ...m, c: this.size - 1 - m.c })));
      }
    } else if (direction === 'up') {
      for (let c = 0; c < this.size; c++) {
        const col = this.grid.map(row => row[c]);
        const result = this._mergeLine(col, c, 'col');
        if (result.changed) moved = true;
        for (let r = 0; r < this.size; r++) this.grid[r][c] = result.line[r];
        merges.push(...result.merges.map(m => ({ r: m.r, c: c })));
      }
    } else if (direction === 'down') {
      for (let c = 0; c < this.size; c++) {
        const col = this.grid.map(row => row[c]).reverse();
        const result = this._mergeLine(col, c, 'col_rev');
        if (result.changed) moved = true;
        const line = result.line.reverse();
        for (let r = 0; r < this.size; r++) this.grid[r][c] = line[r];
        merges.push(...result.merges.map(m => ({ r: this.size - 1 - m.r, c: c })));
      }
    }

    if (moved) {
      this.history.push(snapshot);
      if (this.history.length > 50) this.history.shift();
      this.spawn();
      if (!this.canMove()) this.over = true;
      if (this.score > this.best) {
        this.best = this.score;
        localStorage.setItem('best2468', this.best.toString());
      }
      if (this.over) {
        this.audio.play('gameover');
      } else if (merges.length > 0) {
        this.audio.play('merge');
      } else {
        this.audio.play('move');
      }
      this._saveGame();
    }

    return { moved, merges, oldGrid };
  }

  undo() {
    if (this.history.length === 0) return false;
    const prev = this.history.pop();
    this.grid = prev.grid;
    this.score = prev.score;
    this.won = prev.won;
    this.over = prev.over;
    this._saveGame();
    return true;
  }

  canUndo() {
    return this.history.length > 0;
  }

  _mergeLine(line, index, type) {
    const arr = line.filter(v => v !== 0);
    let changed = arr.length !== line.length;
    const merges = [];
    const result = [];
    let j = 0;

    while (j < arr.length) {
      if (j + 1 < arr.length && arr[j] === arr[j + 1]) {
        const val = arr[j] * 2;
        result.push(val);
        this.score += val;
        if (val === 2048) {
          this.won = true;
          this.audio.play('win');
        }

        const pos = result.length - 1;
        let r, c;
        if (type === 'row' || type === 'row_rev') { r = index; c = pos; }
        else { r = pos; c = index; }
        merges.push({ r, c, value: val });

        changed = true;
        j += 2;
      } else {
        result.push(arr[j]);
        j += 1;
      }
    }

    while (result.length < this.size) result.push(0);

    return { line: result, changed, merges };
  }

  canMove() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return true;
        if (c < this.size - 1 && this.grid[r][c] === this.grid[r][c + 1]) return true;
        if (r < this.size - 1 && this.grid[r][c] === this.grid[r + 1][c]) return true;
      }
    }
    return false;
  }

  _saveGame() {
    try {
      localStorage.setItem('2468-save', JSON.stringify({
        grid: this.grid,
        score: this.score,
        won: this.won,
        over: this.over,
        size: this.size
      }));
    } catch(e) {}
  }

  _loadGame() {
    try {
      const raw = localStorage.getItem('2468-save');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  }

  toggleAudio() {
    this.audio.enabled = !this.audio.enabled;
    return this.audio.enabled;
  }

  getState() {
    return {
      grid: this.grid.map(row => [...row]),
      score: this.score,
      best: this.best,
      won: this.won,
      over: this.over
    };
  }
}
