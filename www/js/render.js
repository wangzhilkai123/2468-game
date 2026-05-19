const COLORS = {
  2:    { bg: '#eee4da', fg: '#776e65' },
  4:    { bg: '#ede0c8', fg: '#776e65' },
  8:    { bg: '#f2b179', fg: '#f9f6f2' },
  16:   { bg: '#f59563', fg: '#f9f6f2' },
  32:   { bg: '#f67c5f', fg: '#f9f6f2' },
  64:   { bg: '#f65e3b', fg: '#f9f6f2' },
  128:  { bg: '#edcf72', fg: '#f9f6f2' },
  256:  { bg: '#edcc61', fg: '#f9f6f2' },
  512:  { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
  4096: { bg: '#3c3a32', fg: '#f9f6f2' },
  8192: { bg: '#3c3a32', fg: '#f9f6f2' }
};

function tileColor(value) {
  return COLORS[value] || { bg: '#000000', fg: '#ffffff' };
}

class Renderer {
  constructor(canvas, size = 4) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.cellSize = 0;
    this.gap = 0;
    this.animations = [];
    this.resize();
  }

  resize() {
    const maxSize = Math.min(window.innerWidth - 32, 500);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = maxSize + 'px';
    this.canvas.style.height = maxSize + 'px';
    this.canvas.width = maxSize * dpr;
    this.canvas.height = maxSize * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displaySize = maxSize;
    this.gap = maxSize * 0.03;
    this.cellSize = (maxSize - this.gap * (this.size + 1)) / this.size;
  }

  getCellPos(r, c) {
    return {
      x: this.gap + c * (this.cellSize + this.gap),
      y: this.gap + r * (this.cellSize + this.gap)
    };
  }

  draw(state, oldGrid, merges) {
    const ctx = this.ctx;
    const { grid } = state;
    const d = this.displaySize;

    // Background
    ctx.fillStyle = '#faf8ef';
    ctx.fillRect(0, 0, d, d);

    // Grid background
    ctx.fillStyle = '#bbada0';
    this._roundRect(0, 0, d, d, this.gap * 1.5);
    ctx.fill();

    // Cells
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const { x, y } = this.getCellPos(r, c);
        ctx.fillStyle = 'rgba(238, 228, 218, 0.35)';
        this._roundRect(x, y, this.cellSize, this.cellSize, this.cellSize * 0.1);
        ctx.fill();
      }
    }

    // Merge effects
    const mergeSet = new Set();
    if (merges) {
      for (const m of merges) {
        mergeSet.add(`${m.r},${m.c}`);
      }
    }

    // Tiles
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = grid[r][c];
        if (val === 0) continue;
        const { x, y } = this.getCellPos(r, c);
        const color = tileColor(val);
        const key = `${r},${c}`;
        const isNew = mergeSet.has(key);

        ctx.fillStyle = color.bg;
        this._roundRect(x, y, this.cellSize, this.cellSize, this.cellSize * 0.1);
        ctx.fill();

        // Merge pop animation
        if (isNew) {
          ctx.save();
          const cx = x + this.cellSize / 2;
          const cy = y + this.cellSize / 2;
          ctx.translate(cx, cy);
          ctx.scale(1.15, 1.15);
          ctx.translate(-cx, -cy);
          ctx.fillStyle = color.bg;
          this._roundRect(x, y, this.cellSize, this.cellSize, this.cellSize * 0.1);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = color.fg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = val >= 10000 ? this.cellSize * 0.28 :
                         val >= 1000 ? this.cellSize * 0.35 :
                         this.cellSize * 0.45;
        ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
        const cx = x + this.cellSize / 2;
        const cy = y + this.cellSize / 2;
        ctx.fillText(val.toString(), cx, cy);
      }
    }

    // Overlay
    if (state.over) {
      ctx.fillStyle = 'rgba(238, 228, 218, 0.73)';
      ctx.fillRect(0, 0, d, d);
      ctx.fillStyle = '#776e65';
      ctx.font = `bold ${d * 0.08}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束', d / 2, d / 2 - 10);
    } else if (state.won) {
      ctx.fillStyle = 'rgba(237, 194, 46, 0.5)';
      ctx.fillRect(0, 0, d, d);
      ctx.fillStyle = '#f9f6f2';
      ctx.font = `bold ${d * 0.08}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('恭喜！达到 2048！', d / 2, d / 2 - 10);
      ctx.font = `${d * 0.04}px "Segoe UI", Arial, sans-serif`;
      ctx.fillText('继续挑战更高分吧', d / 2, d / 2 + 25);
    }
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
