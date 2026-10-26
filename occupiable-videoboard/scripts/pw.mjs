// Load Playwright from the project (npm i -D playwright) or from a global install (NODE_PATH).
import { createRequire } from 'node:module';

export async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    return createRequire(import.meta.url)('playwright');
  }
}

// SwiftShader flags let headless Chromium render WebGL2 on machines without a GPU;
// on a machine with a GPU, set GPU=1 to use it instead.
export const CHROME_ARGS = process.env.GPU
  ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
