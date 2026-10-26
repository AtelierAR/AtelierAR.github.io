// Resolve Playwright from the project, or fall back to a globally installed
// copy (CI images / cloud sessions often ship Playwright + Chromium globally).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

export async function loadPlaywright() {
  try { return await import('playwright'); } catch { /* not a project dependency */ }
  const require = createRequire(import.meta.url);
  const roots = [process.env.PLAYWRIGHT_MODULE_DIR, '/opt/node-tools/node_modules'];
  try { roots.push(execSync('npm root -g', { encoding: 'utf8' }).trim()); } catch { /* no npm */ }
  for (const r of roots.filter(Boolean)) {
    try { return require(require.resolve('playwright', { paths: [r] })); } catch { /* next */ }
  }
  throw new Error('Playwright not found: `npm i -D playwright && npx playwright install chromium`');
}

// GPU by default; RECORD_SWIFTSHADER=1 forces the software rasterizer.
export function chromiumArgs() {
  const soft = process.env.RECORD_SWIFTSHADER === '1';
  return soft
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    : ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=default'];
}
