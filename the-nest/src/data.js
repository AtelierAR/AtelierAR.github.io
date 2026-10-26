// All on-screen copy and timing. Every string cites its deck page
// (20261022_LFF_Eagles_HKS.pdf). Nothing here is invented; any new line must be
// marked // PROPOSED COPY.

export const FPS = 60;

// Scene boundaries in seconds. Longer than the brief's 75 s because the 0.4 s/word
// reading minimum on the p9 paragraph (81 words) needs ≥ 32.4 s; see REFERENCE_NOTES.md.
export const SCENES = [
  { id: 'energy', start: 0.0, end: 12.6 },
  { id: 'ambition', start: 12.6, end: 23.0 },
  { id: 'drivers', start: 23.0, end: 37.0 },
  { id: 'nest', start: 37.0, end: 65.0 },
  { id: 'reveal', start: 65.0, end: 81.0 },
];
export const DURATION = SCENES[SCENES.length - 1].end;

export const ENERGY = {
  // p4 headline: light "HOUSE OF" + black "ENERGY", green square dot, black "HIGHER AMPLITUDE"
  headline: [
    [{ t: 'HOUSE OF ', w: 'light' }, { t: 'ENERGY', w: 'black' }, { t: ' ·', w: 'dot' }],
    [{ t: 'HIGHER AMPLITUDE', w: 'black' }],
  ],
  // p4 body, two sentences
  body: [
    "The renovation treats the crowd as the building's power source.",
    'Canopy, rake, and enclosure are tuned like an instrument — holding sound in the bowl and returning it to the field louder.',
  ],
  today: 'TODAY', // p4 waveform label
  renovated: 'RENOVATED BOWL', // p4 waveform label
};

export const AMBITION = {
  eyebrow: 'HKS AMBITION', // p2
  rail: '02 · HKS STRATEGY', // p2 rotated rail label
  headline: ['A GENERATIONAL', 'TRANSFORMATION'], // p2
  lines: [
    'Preserve The Linc', // p2
    'Transform what limits its future', // p2
    'A renovation that performs like a new-build', // p2
    'Unmistakably Eagles', // p2
  ],
};

export const DRIVERS = {
  grit: 'GENERATIONAL GRIT.', // p5
  local: 'HYPER LOCAL', // p6
  give: {
    eyebrow: 'PHILADELPHIA EAGLES', // p7
    headline: ['GIVE MORE', 'THAN YOU TAKE'], // p7
    sub: ['For the city.', 'For the team.', 'For each other.'], // p7 (set in caps on the slide)
    pillars: [
      { title: 'BUILT FOR MORE', body: 'Designing spaces that inspire, unite, and uplift generations.' }, // p7
      { title: 'ROOTED IN COMMUNITY', body: 'Listening, learning, and building together.' }, // p7
      { title: 'CREATING LASTING IMPACT', body: 'Beyond the game. Beyond today. For tomorrow.' }, // p7
    ],
  },
};

export const NEST = {
  title: 'THE NEST', // p9
  sub: 'GENERATIONAL FABRIC OF PHILADELPHIA', // p9 (followed by a teal ellipsis)
  small: 'THE NEW HOME FOR EAGLES NATION.', // p9
  // p9 concept paragraph, verbatim, as sentences. Each sentence is broken into lines of
  // ≤ 60 characters and shown two lines at a time.
  paragraph: [
    'The Nest is conceived as a “kit of parts,” weaving together the generational fabric of Philadelphia into a single architectural language.',
    'Solid masonry and steel surfaces root the building in the city’s grit and industrial origins.',
    'Vertical glass fins express contemporary Philadelphia — a leader in arts, culture, business, and sport.',
    'Embedded digital elements gesture toward the city’s future.',
    'Reflective surfaces evoke the Eagles brand itself, dissolving the line between team and city: the Eagles are Philly, and Philly is the Eagles.',
  ],
  eras: ['THE PAST…', 'THE CONTEMPORARY…', 'THE FUTURE…', 'PHILLY FAITHFUL…'], // p10
  materialHeading: 'MATERIAL LANGUAGE', // p10
  materials: [
    { id: 'masonry', name: 'MASONRY', caption: 'Solid. Enduring. Rooted in the City.', era: 0 }, // p10
    { id: 'steel', name: 'STEEL', caption: 'Industrial. Strong. Built to Last.', era: 0 }, // p10
    { id: 'glass', name: 'GLASS', caption: 'Transparent. Vertical. Forward Looking.', era: 1 }, // p10
    { id: 'digital', name: 'DIGITAL', caption: 'Dynamic. Intelligent. Future Ready.', era: 2 }, // p10
    { id: 'reflective', name: 'REFLECTIVE', caption: 'Unity. Pride. Mirror of the City.', era: 3 }, // p10
  ],
  reflectionHeading: 'A REFLECTION OF PHILADELPHIA', // p10
  triptych: ['OUR CITY', 'OUR ARCHITECTURE', 'OUR IDENTITY'], // p10
};

export const REVEAL = {
  // p26 Plaza View leader labels, in build order (bases first, canopy last)
  layers: [
    { id: 'masonry', label: 'Masonry' }, // p26
    { id: 'steel', label: 'Steel' }, // material from p10 MATERIAL LANGUAGE; p26 does not label the frame
    { id: 'glazing', label: 'Glazing' }, // p26
    { id: 'fins', label: 'Fins' }, // p26
    { id: 'board', label: 'Video Board' }, // p26
    { id: 'soffit', label: 'Reflective Soffit' }, // p26
  ],
  endTitle: 'THE NEST', // p9
  endLine: 'The Eagles are Philly, and Philly is the Eagles.', // p9 (final clause of the paragraph)
};

// Reading-time rule from the brief: a sentence stays on screen ≥ 0.4 s per word.
export const SECONDS_PER_WORD = 0.4;
export const words = (s) => s.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
export const minSeconds = (s) => words(s) * SECONDS_PER_WORD;
