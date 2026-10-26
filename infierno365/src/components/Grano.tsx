import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GRANO} from '../constants/brand';

/** Grano fílmico ≤ 6 %. Cambia cada 2 frames, sin variación de brillo global. */
export const Grano: React.FC<{opacidad?: number}> = ({opacidad = GRANO}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 97;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: Math.min(opacidad, 0.06)}}>
      <svg width="100%" height="100%">
        <filter id={`grano-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grano-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
