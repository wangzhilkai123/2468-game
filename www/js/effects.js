const CONFETTI_COLORS = [
  '#edc22e', '#f59563', '#f67c5f', '#f65e3b',
  '#edcf72', '#edc850', '#5dade2', '#58d68d',
  '#af7ac5', '#f1948a', '#85c1e9', '#f8c471'
];

class EffectsEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.particles = [];
    this.floatingTexts = [];
    this.confetti = [];
    this.dark = false;
    this.displaySize = 0;
  }

  sync(renderer) {
    this.dark = renderer.dark;
    this.displaySize = renderer.displaySize;
  }

  addMergeEffects(merges, renderer) {
    this.sync(renderer);
    for (const m of merges) {
      const pos = renderer.getCellPos(m.r, m.c);
      const cx = pos.x + renderer.cellSize / 2;
      const cy = pos.y + renderer.cellSize / 2;
      const color = tileColor(m.value, this.dark).bg;
      this._spawnParticles(cx, cy, color);
      this._spawnFloatingText(cx, cy, m.value);
      if (m.value === 2048) {
        this._spawnConfetti();
      }
    }
  }

  _spawnParticles(cx, cy, color) {
    const count = 12 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i / count) + (Math.random() - 0.5) * 1.0;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6,
        maxLife: 0.6,
        color: color,
        radius: 3 + Math.random() * 5
      });
    }
  }

  _spawnFloatingText(cx, cy, value) {
    this.floatingTexts.push({
      x: cx,
      y: cy,
      text: '+' + value,
      life: 1.0,
      maxLife: 1.0,
      color: this.dark ? '#ffffff' : '#776e65'
    });
  }

  _spawnConfetti() {
    const count = 120 + Math.floor(Math.random() * 31);
    for (let i = 0; i < count; i++) {
      this.confetti.push({
        x: Math.random() * this.displaySize,
        y: -30 - Math.random() * 150,
        vx: (Math.random() - 0.5) * 80,
        vy: 100 + Math.random() * 160,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 400,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 3.5,
        maxLife: 3.5
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 150 * dt;
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y -= 100 * dt;
    }

    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.life -= dt;
      if (c.life <= 0) {
        this.confetti.splice(i, 1);
        continue;
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rotation += c.rotationSpeed * dt;
      c.vy *= 0.999;
    }
  }

  draw(ctx) {
    if (this.particles.length === 0 && this.floatingTexts.length === 0 && this.confetti.length === 0) return;
    ctx.save();

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }

    for (const t of this.floatingTexts) {
      const alpha = Math.min(t.life / t.maxLife, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      const fontSize = Math.max(16, Math.min(28, this.displaySize * 0.06));
      ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, t.x, t.y);
    }

    for (const c of this.confetti) {
      const alpha = Math.min(c.life / c.maxLife, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = c.color;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation * Math.PI / 180);
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }

    ctx.restore();
  }

  get needsLoop() {
    return this.particles.length > 0 ||
           this.floatingTexts.length > 0 ||
           this.confetti.length > 0;
  }

  clear() {
    this.particles.length = 0;
    this.floatingTexts.length = 0;
    this.confetti.length = 0;
  }
}
