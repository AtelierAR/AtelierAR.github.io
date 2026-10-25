import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ALTO, ANCHO, VISUAL } from '../constants/brand';

/** Grano fílmico sutil (opacidad ≤ 6 %). Cambia cada 2 cuadros; se congela si se indica. */
export const Grano: React.FC<{ congelarEn?: number }> = ({ congelarEn = Infinity }) => {
  const frame = Math.min(useCurrentFrame(), congelarEn);
  const semilla = Math.floor(frame / 2) % 97;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: Math.min(VISUAL.granoOpacidad, 0.06), mixBlendMode: 'screen' }}>
      <svg width={ANCHO} height={ALTO}>
        <filter id="grano">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={semilla} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grano)" />
      </svg>
    </AbsoluteFill>
  );
};
