// Videoboard content: an abstract midnight-green motion loop (no marks or logos), drawn to a
// canvas each frame from the master clock so recording is deterministic.
import * as THREE from 'three';
import { PAL } from './data.js';

export function createBoardScreen() {
  const W = 768, H = 384;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  // LED pixel grid, drawn once
  const grid = document.createElement('canvas');
  grid.width = W; grid.height = H;
  const gg = grid.getContext('2d');
  gg.fillStyle = 'rgba(0,0,0,0.22)';
  for (let x = 0; x < W; x += 4) gg.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 4) gg.fillRect(0, y, W, 1);

  let last = -1;
  function update(t, mode = 0) {
    const f = Math.round(t * 30) / 30; // 30 Hz content is plenty
    if (f === last) return;
    last = f;
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a2f35');
    bg.addColorStop(0.55, PAL.midnight);
    bg.addColorStop(1, '#0d5f63');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // sweeping wing-like light bands
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const p = ((f * 0.11 + i / 7) % 1);
      const x = -W * 0.4 + p * W * 1.8;
      const grd = g.createLinearGradient(x - 140, 0, x + 140, 0);
      const a = 0.10 + 0.08 * Math.sin(i * 1.7);
      grd.addColorStop(0, 'rgba(65,182,175,0)');
      grd.addColorStop(0.5, `rgba(65,182,175,${a})`);
      grd.addColorStop(1, 'rgba(65,182,175,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(x - 160, H); g.lineTo(x + 40, 0); g.lineTo(x + 120, 0); g.lineTo(x - 80, H);
      g.fill();
    }
    // a soft silver horizon line and a slow pulse
    const pulse = 0.5 + 0.5 * Math.sin(f * 1.3);
    g.fillStyle = `rgba(165,172,175,${0.18 + 0.12 * pulse})`;
    g.fillRect(0, H * 0.66, W, 3);
    g.restore();
    if (mode === 1) { // dusk: deeper midnight-green wash so the board lights the plaza green
      g.fillStyle = 'rgba(8,52,58,0.45)'; g.fillRect(0, 0, W, H);
    }
    g.drawImage(grid, 0, 0);
    tex.needsUpdate = true;
  }
  update(0);
  return { canvas: c, texture: tex, update };
}
