import { s1 } from './s1_today.js';
import { s2 } from './s2_field.js';
import { s3 } from './s3_section.js';
import { s4 } from './s4_north.js';
import { s5 } from './s5_south.js';
import { s6 } from './s6_compare.js';
import { s7 } from './s7_ladder.js';
import { s8 } from './s8_manifest.js';
import { s9 } from './s9_seat.js';

// Storyboard (seconds). Each scene owns [start, end) on the master timeline.
export const SCENES = [s1, s2, s3, s4, s5, s6, s7, s8, s9];
export const DURATION = s9.end;
