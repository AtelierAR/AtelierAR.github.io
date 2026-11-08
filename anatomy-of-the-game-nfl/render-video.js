/*
  Renders the animation in index.html to an MP4 (1080x1350, 4:5, 30 fps, with the generated score).
  Requires Node, Playwright (Chromium) and ffmpeg on PATH.

    node render-video.js [out.mp4] [fps]

  Every frame is drawn deterministically by window.__render(t); the score is rendered with an
  OfflineAudioContext, so the output is identical from run to run.
*/
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = path.resolve(process.argv[2] || path.join(__dirname, 'anatomy-of-the-game-football.mp4'));
  const fps = Number(process.argv[3] || 30), DUR = 116, N = Math.round(DUR * fps);
  const wav = out.replace(/\.mp4$/, '') + '.score.wav';

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?export=1');
  await page.waitForFunction(() => window.__ready);

  console.log('rendering score…');
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.__renderAudio()), 'base64'));

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg exited ' + code))));

  for (let i = 0; i < N; i++) {
    const b64 = await page.evaluate(t => { window.__render(t); return document.getElementById('cv').toDataURL('image/png').slice(22); }, i / fps);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % fps === 0) process.stdout.write(`\rframe ${i}/${N}`);
  }
  ff.stdin.end(); await done; await browser.close();
  fs.unlinkSync(wav);
  console.log('\nwrote', out);
})().catch(e => { console.error(e); process.exit(1); });
