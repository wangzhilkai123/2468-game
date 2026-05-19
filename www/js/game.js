class GameState {
  constructor(size = 4) {
    this.size = size;
    this.score = 0;
    this.best = parseInt(localStorage.getItem('best2468') || '0');
    this.won = false;
    this.over = false;
    this.grid = [];
    this.init();
  }

  init() {
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.score = 0;
    this.won = false;
    this.over = false;
    this.spawn();
    this.spawn();
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
      this.spawn();
      if (!this.canMove()) this.over = true;
      if (this.score > this.best) {
        this.best = this.score;
        localStorage.setItem('best2468', this.best.toString());
      }
    }

    return { moved, merges, oldGrid };
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
        if (val === 2048) this.won = true;

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
