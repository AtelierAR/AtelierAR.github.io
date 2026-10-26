// Live playback of the procedural crowd: filtered noise whose gain follows the same
// envelope as the visuals (src/audio/envelope.js). The recording uses the identical
// envelope rendered offline (scripts/render-audio.mjs), so picture and sound agree.
import { crowd, TOUCHDOWN_T } from './envelope.js';

export class CrowdAudio {
  constructor() {
    this.ctx = null;
  }
  resume() {
    if (!this.ctx) this.#init();
    this.ctx?.resume();
  }
  #init() {
    try {
      const ac = new AudioContext();
      const len = ac.sampleRate * 4;
      const buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + w * 0.099046;
          b1 = 0.963 * b1 + w * 0.2965164;
          b2 = 0.57 * b2 + w * 1.0526913;
          d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
        }
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 900;
      bp.Q.value = 0.6;
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      const gain = ac.createGain();
      gain.gain.value = 0;
      src.connect(bp).connect(lp).connect(gain).connect(ac.destination);
      src.start();
      this.ctx = ac;
      this.gain = gain;
      this.bp = bp;
    } catch {
      this.ctx = null;
    }
  }
  update(t, playing) {
    if (!this.ctx) return;
    const v = playing ? crowd(t) : 0;
    const now = this.ctx.currentTime;
    this.gain.gain.setTargetAtTime(v * 0.9, now, 0.05);
    this.bp.frequency.setTargetAtTime(700 + 900 * v + (t > TOUCHDOWN_T && t < TOUCHDOWN_T + 3 ? 400 : 0), now, 0.1);
  }
}
