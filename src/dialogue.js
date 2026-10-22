// Dialogue bank + deterministic scheduler.
// Every device computes the same conversation for the same UTC slot: slot index -> seeded RNG,
// and who is where comes from each brain's pure actAt(t). No network needed.
export const ZONE = { pantry: 'pantry', game: 'lounge', read: 'lounge', sketch: 'lounge', meeting: 'meeting', work: 'desk', fidget: 'desk', bob: 'desk', stretch: 'desk', pace: 'desk' };

// Solo desk quips (said to nobody in particular).
export const QUIPS = {
  Pixel: ['Compiles first try?! Suspicious.', 'One more feature. Then coffee.', 'Who put a bug in my bug fix?', 'Frame rate: chef\'s kiss.', 'It works on my machine™', 'Speedrun PB on this build: 4 min.', 'Green build! 🎉', 'Shipping it. Probably.', 'Hitboxes are a state of mind.', 'Need… more… particles.', 'Refactor now, regret later.', 'Who wants a pixel-art cat?'],
  Jun: ['8px grid. Always.', 'This button is 1px off. I can feel it.', 'Kerning: fixed. Peace: restored.', 'Is this teal or sea-foam? …Teal.', 'Robber Town specs: still paused.', 'Rounded corners make people happy.', 'Whitespace is a feature.', 'Moodboard is getting moody.', 'Contrast ratio 4.6. Lovely.', 'Hmm. Needs more breathing room.', 'Auto-layout, you beautiful thing.', 'One more variant, I promise.'],
  Sage: ['Let\'s weigh the options…', 'Option B, with a dash of C.', 'Interesting. Very interesting.', 'Ship small, learn fast.', 'Every roadmap is a hypothesis.', 'Noting this for Calvin.', 'Three risks, two mitigations.', 'The data says… hmm, wait.', 'Patience is a strategy too.', 'Another tea might clarify this.', 'First principles, then coffee.', 'A good question beats a fast answer.'],
  Mika: ['Cut on the beat. Chef\'s kiss.', 'This chorus needs a slow-mo.', 'Rendering… go, little progress bar.', 'Colour grade: sunset vibes.', 'One more pass on the transitions.', 'Imagine.ooo drop goes hard.', 'Who moved my keyframes?', 'Looping this hook for the 40th time.', 'J-cut, L-cut, lunch-cut.', 'B-roll of clouds? Yes please.', 'Audio waveform looks like mountains.', 'Export done! Next track!'],
};

// Exchanges: who = [names] (specific) or null (any two). where = zone or 'any'. lines = [speakerIdx, text].
export const EXCHANGES = [
  { who: ['Pixel', 'Mika'], where: 'pantry', lines: [[0, 'Third coffee. Don\'t judge.'], [1, 'Smoothie gang says hi.'], [0, 'Is that kale?! Brave.'], [1, 'It\'s purple. It\'s fine.']] },
  { who: ['Pixel', 'Jun'], where: 'pantry', lines: [[1, 'Your HUD font is still Comic Sans.'], [0, 'It\'s… retro?'], [1, 'It\'s a crime.']] },
  { who: ['Sage', 'Jun'], where: 'pantry', lines: [[0, 'Green tea or jasmine?'], [1, 'Jasmine. It pairs with pastel.'], [0, 'A design-led choice. Approved.']] },
  { who: ['Mika', 'Sage'], where: 'pantry', lines: [[0, 'Sage, thumbnail A or B?'], [1, 'Which one made you smile?'], [0, 'B.'], [1, 'Then B.']] },
  { who: null, where: 'pantry', lines: [[0, 'Who finished the cookies?'], [1, '…the cookies were a team effort.']] },
  { who: null, where: 'pantry', lines: [[0, 'The coffee machine is judging me.'], [1, 'It judges everyone. Equal opportunity.']] },
  { who: null, where: 'pantry', lines: [[0, 'Break time is productive time.'], [1, 'That\'s going on a mug.']] },
  { who: ['Pixel', 'Sage'], where: 'lounge', lines: [[0, 'Sage, wanna play co-op?'], [1, 'Only if it\'s a strategy game.'], [0, 'It\'s… a jumping game.'], [1, 'Then I\'ll strategise from here.']] },
  { who: ['Jun', 'Sage'], where: 'lounge', lines: [[0, 'Drawing you reading. Hold still.'], [1, 'I\'ve been still for 20 pages.'], [0, 'Perfect model.']] },
  { who: ['Pixel', 'Jun'], where: 'lounge', lines: [[0, 'Boss level! Cheer for me!'], [1, 'Go Pixel go!'], [0, '…I fell in the lava.']] },
  { who: null, where: 'lounge', lines: [[0, 'This sofa is dangerously comfy.'], [1, 'Five more minutes.'], [0, 'You said that ten minutes ago.']] },
  { who: null, where: 'lounge', lines: [[0, 'Look, a cloud shaped like a cat.'], [1, 'That\'s a bug report.']] },
  { who: ['Sage', 'Mika'], where: 'meeting', lines: [[0, 'Upload cadence: twice a week?'], [1, 'Twice a week and one surprise.'], [0, 'Surprises, scheduled. I like it.']] },
  { who: ['Sage', 'Pixel'], where: 'meeting', lines: [[0, 'What\'s the MVP?'], [1, 'Everything!'], [0, 'Let\'s try that again.'], [1, '…a chibi that walks.']] },
  { who: null, where: 'meeting', lines: [[0, 'Agenda item one: snacks.'], [1, 'Seconded.']] },
  { who: null, where: 'meeting', lines: [[0, 'Any blockers?'], [1, 'Just Monday.'], [0, 'Noted. Monday is a known risk.']] },
  { who: null, where: 'meeting', lines: [[0, 'Let\'s timebox this.'], [1, 'Timebox… with a ribbon?'], [0, 'Fifteen minutes, ribbon optional.']] },
  { who: ['Pixel', 'Jun'], where: 'desk', lines: [[0, 'Jun, can the button be bouncier?'], [1, 'Define bouncier.'], [0, 'Boing.'], [1, '…I\'ll allow one boing.']] },
  { who: ['Mika', 'Pixel'], where: 'desk', lines: [[0, 'Pixel, I need a game clip!'], [1, 'Gameplay or bloopers?'], [0, 'Bloopers. Always bloopers.']] },
  { who: ['Jun', 'Mika'], where: 'desk', lines: [[0, 'Love that colour grade, Mika.'], [1, 'Stole it from your palette.'], [0, 'Flattered and slightly robbed.']] },
  { who: ['Sage', 'Pixel'], where: 'desk', lines: [[0, 'How\'s the build?'], [1, 'Green! Mostly. Partly.'], [0, 'Partly green is still green.']] },
  { who: ['Sage', 'Jun'], where: 'desk', lines: [[1, 'Sage, is Robber Town still paused?'], [0, 'Paused, not forgotten.']] },
  { who: null, where: 'desk', lines: [[0, 'Lunch plans?'], [1, 'Dumplings. Obviously.']] },
  { who: null, where: 'desk', lines: [[0, 'Did you hear that?'], [1, 'The waterfall again?'], [0, 'So soothing. Very distracting.']] },
  { who: null, where: 'desk', lines: [[0, 'High five for Thursday!'], [1, 'It\'s… sure, why not! ✋']] },
  { who: null, where: 'desk', lines: [[0, 'I named my monitor Kevin.'], [1, 'Hi Kevin.']] },
];

// Greetings / small talk for Calvin (the boss).
export const GREET = {
  Pixel: ['Boss! Wanna see a new build?', 'Hey Calvin! The chibis walk now!', 'Calvin! Coffee run later?'],
  Jun: ['Hi Calvin! Pixel-perfect day so far.', 'Oh hey boss, the specs are tidy!', 'Calvin! Want to see the new palette?'],
  Sage: ['Good to see you, Calvin.', 'Calvin, I have three ideas and one warning.', 'Ah, the founder himself.'],
  Mika: ['Calvin! New track edit is fire 🔥', 'Hey boss! Imagine.ooo is vibing today.', 'Calvin! Thumbnail opinions?'],
};
export const HI_BACK = {
  Pixel: 'Hi hi! *waves controller*', Jun: 'Hello! *neat little wave*', Sage: 'Hello, Calvin. Always a pleasure.', Mika: 'Heyyy! *headphones bob*',
};

// ---- deterministic scheduler ----
export const SLOT = 22, LINE = 3.6;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const cache = new Map();
// bots: [{name, brain}] -> conversation for slot k: { start, lines:[[name,text]] } or null
export function conversationFor(k, bots) {
  if (cache.has(k)) return cache.get(k);
  const r = rng(k * 2654435761), t0 = k * SLOT + 2; const zones = {};
  bots.forEach(b => { const z = ZONE[b.brain.actAt(t0 + 1)] || 'desk'; (zones[z] ||= []).push(b.name); });
  let conv = null;
  const social = ['pantry', 'lounge', 'meeting'].filter(z => zones[z]?.length >= 2);
  const zone = social.length ? social[Math.floor(r() * social.length)] : (r() < 0.55 && zones.desk?.length >= 2 ? 'desk' : null);
  if (zone) { const ppl = zones[zone]; const opts = EXCHANGES.filter(e => (e.where === zone || e.where === 'any') && (!e.who || e.who.every(n => ppl.includes(n))));
    const e = opts[Math.floor(r() * opts.length)]; let who = e.who;
    if (!who) { const a = ppl[Math.floor(r() * ppl.length)]; const rest = ppl.filter(n => n !== a); who = [a, rest[Math.floor(r() * rest.length)]]; }
    conv = { start: t0, lines: e.lines.map(([i, tx]) => [who[i], tx]) }; }
  else if (zones.desk?.length && r() < 0.8) { const n = zones.desk[Math.floor(r() * zones.desk.length)]; const q = QUIPS[n]; conv = { start: t0 + r() * 6, lines: [[n, q[Math.floor(r() * q.length)]]] }; }
  cache.set(k, conv); if (cache.size > 50) cache.delete(cache.keys().next().value); return conv;
}
// what is `name` saying at time t (or null)
export function speechAt(t, bots) { const k = Math.floor(t / SLOT); const c = conversationFor(k, bots); if (!c) return null;
  const i = Math.floor((t - c.start) / LINE); if (i < 0 || i >= c.lines.length) return null; return { name: c.lines[i][0], text: c.lines[i][1], partner: c.lines.find(l => l[0] !== c.lines[i][0])?.[0] }; }
