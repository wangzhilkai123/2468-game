const COLORS_LIGHT = {
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

const COLORS_DARK = {
  2:    { bg: '#3a3a3a', fg: '#ccc' },
  4:    { bg: '#4a4a4a', fg: '#ddd' },
  8:    { bg: '#c1794f', fg: '#fff' },
  16:   { bg: '#d5693f', fg: '#fff' },
  32:   { bg: '#d45237', fg: '#fff' },
  64:   { bg: '#e04430', fg: '#fff' },
  128:  { bg: '#c9a73a', fg: '#fff' },
  256:  { bg: '#c9a42f', fg: '#fff' },
  512:  { bg: '#c9a01e', fg: '#fff' },
  1024: { bg: '#c99d0e', fg: '#fff' },
  2048: { bg: '#e0b800', fg: '#fff' },
  4096: { bg: '#1a1a1a', fg: '#fff' },
  8192: { bg: '#1a1a1a', fg: '#fff' }
};

function tileColor(value, dark) {
  const map = dark ? COLORS_DARK : COLORS_LIGHT;
  return map[value] || { bg: dark ? '#000' : '#000', fg: '#fff' };
}

class Renderer {
  constructor(canvas, size = 4) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.cellSize = 0;
    this.gap = 0;
    this.dark = false;
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

  draw(state) {
    const ctx = this.ctx;
    const { grid } = state;
    const d = this.displaySize;
    const dark = this.dark;

    ctx.fillStyle = dark ? '#1e1e2e' : '#faf8ef';
    ctx.fillRect(0, 0, d, d);

    ctx.fillStyle = dark ? '#3a3a4a' : '#bbada0';
    this._roundRect(0, 0, d, d, this.gap * 1.5);
    ctx.fill();

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const { x, y } = this.getCellPos(r, c);
        ctx.fillStyle = dark ? 'rgba(50,50,60,0.5)' : 'rgba(238, 228, 218, 0.35)';
        this._roundRect(x, y, this.cellSize, this.cellSize, this.cellSize * 0.1);
        ctx.fill();
      }
    }

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = grid[r][c];
        if (val === 0) continue;
        const { x, y } = this.getCellPos(r, c);
        const color = tileColor(val, dark);

        ctx.fillStyle = color.bg;
        this._roundRect(x, y, this.cellSize, this.cellSize, this.cellSize * 0.1);
        ctx.fill();

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

    if (state.over) {
      ctx.fillStyle = dark ? 'rgba(30, 30, 46, 0.8)' : 'rgba(238, 228, 218, 0.73)';
      ctx.fillRect(0, 0, d, d);
      ctx.fillStyle = dark ? '#ccc' : '#776e65';
      ctx.font = `bold ${d * 0.08}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束', d / 2, d / 2 - 10);
    } else if (state.won) {
      ctx.fillStyle = 'rgba(237, 194, 46, 0.5)';
      ctx.fillRect(0, 0, d, d);
      ctx.fillStyle = '#fff';
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
