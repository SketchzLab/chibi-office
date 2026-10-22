// Branching mini-conversations between Calvin and the bots.
// A conversation = nodes { say, emote, choices:[{ t, say, react, emote, act, then, topic }] }.
// Context-aware: task (status.json), hobbies, local time of day, where the bot is, what Calvin is doing, and memory (localStorage).
const pick = a => a[Math.floor(Math.random() * a.length)];
const MEM_KEY = 'chibiOffice.memory.v1';
export const mem = { load() { try { return JSON.parse(localStorage.getItem(MEM_KEY)) || {}; } catch { return {}; } },
  get(n) { return this.load()[n]; }, set(n, topic) { const m = this.load(); m[n] = { topic, at: Date.now() }; try { localStorage.setItem(MEM_KEY, JSON.stringify(m)); } catch {} } };

let hourOf = () => new Date().getHours(); export function setTalkClock(f) { hourOf = f; }
export function timeOfDay() { const h = hourOf(); return h < 5 ? 'late' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'late'; }
const TOD = {
  morning: { Pixel: 'Morning boss! Coffee number one is in.', Jun: 'Good morning! Fresh grid, fresh mind.', Sage: 'Good morning, Calvin. Mornings are for big decisions.', Mika: 'Mornin\'! Still waking up my ears.' },
  afternoon: { Pixel: 'Afternoon slump? Not with this build!', Jun: 'Afternoon light makes the colours pop.', Sage: 'Good afternoon. Halfway is a fine time to re-plan.', Mika: 'Afternoon vibes = lo-fi playlist.' },
  evening: { Pixel: 'Evening already? I was "almost done" at noon.', Jun: 'The sunset palette is perfect today.', Sage: 'Evening, Calvin. Time to reflect on the day.', Mika: 'Evening is peak editing hours!' },
  late: { Pixel: 'Burning the midnight oil too, boss?', Jun: 'It\'s late… one more pixel, then bed.', Sage: 'Late night, Calvin. Rest is also strategy.', Mika: 'Night owls unite 🦉' },
};
const WHERE = {
  pantry: { Pixel: 'You caught me mid-refill!', Jun: 'Tea break, boss! Join me?', Sage: 'The pantry is where the real meetings happen.', Mika: 'Smoothie o\'clock!' },
  lounge: { Pixel: 'Shh, I\'m on the final boss!', Jun: 'Sketching the lounge. You\'re in it now.', Sage: 'Just a chapter, then back to work.', Mika: 'This sofa has the best acoustics.' },
  meeting: { Pixel: 'Meeting! I brought ideas. Many ideas.', Jun: 'Whiteboard time is my favourite time.', Sage: 'Ah, you\'re just in time for the agenda.', Mika: 'I\'m taking minutes. In emoji.' },
  desk: null,
};
const CALVIN_STATE = {
  mug: { Pixel: 'Ooh, is that coffee? For me?!', Jun: 'Nice mug. Very on-brand.', Sage: 'A man with coffee is a man with a plan.', Mika: 'Coffee and a vibe. Respect.' },
  sofa: { Pixel: 'Boss on the sofa = official break time!', Jun: 'You look very cozy there.', Sage: 'Good. Even founders need to sit.', Mika: 'Sofa squad!' },
  cat: { Pixel: 'Did you pet Mochi? She loves you.', Jun: 'You have cat hair on your sleeve. Cute.', Sage: 'Mochi approves of you. That\'s rare.', Mika: 'Mochi purred? Let me record that!' },
};
const REMEMBER = {
  Pixel: t => `Hey, about ${t} last time — I kept thinking about it!`, Jun: t => `I made a note about ${t} from our last chat.`,
  Sage: t => `Last time we spoke about ${t}. I have a follow-up thought.`, Mika: t => `Still vibing on our ${t} chat from before!`,
};
const LAUGH = ['Hahaha!', 'Pfft— okay that\'s good.', 'You\'re hilarious, boss.', 'LOL 😂'];
export const TIPS = ['Ship the smallest thing that teaches you something.', 'Write the decision down. Future-you will thank you.', 'If two options are close, pick the reversible one.', 'Say no to good ideas so you can say yes to great ones.', 'Talk to one real user this week.', 'Protect your mornings for deep work.', 'Celebrate small wins. Momentum is fuel.', 'When stuck, shrink the problem.', 'Your energy is a resource. Budget it.', 'A clear "why" makes every "how" easier.'];
const SKETCH_FB = ['The spacing is chef\'s kiss. Maybe bump the title 2px?', 'Love it! The colours are cozy. One more shadow?', 'Bold choice. I respect it. Let\'s keep it!', 'That button wants to be rounder. Trust me.'];
const SONGS = ['Imagine.ooo — "Floating Island"', 'Imagine.ooo — "Pantry Lo-fi"', 'Imagine.ooo — "Sunset Commit"', 'Imagine.ooo — "Waterfall Dreams"'];

// Bot-specific activity choice
const ACTIVITY = {
  Pixel: { t: '🎮 Quick game on the sofa?', say: 'Fancy a quick game? Loser buys coffee.', react: 'You\'re ON! Meet me on the sofa!', emote: 'jump', act: 'game', topic: 'a sofa game rematch' },
  Jun: { t: '✏️ Feedback on my sketch?', say: 'Can I get your eyes on my sketch?', react: () => pick(SKETCH_FB), emote: 'nod', act: 'sketchfb', topic: 'your sketch' },
  Sage: { t: '🧭 Any advice?', say: 'Got any advice for me today?', react: () => 'Here\'s one: ' + pick(TIPS), emote: 'nod', act: 'advice', topic: 'that advice' },
  Mika: { t: '🎵 Play me a song?', say: 'Play me something good?', react: () => 'Coming right up: ' + pick(SONGS) + ' 🎶', emote: 'laugh', act: 'song', topic: 'the Imagine.ooo track' },
};
const COFFEE = { t: '☕ Coffee together?', say: 'Coffee run? My treat.', react: { Pixel: 'Did someone say coffee?! Let\'s go!', Jun: 'Jasmine tea for me. Lead the way!', Sage: 'A walk and a brew. Splendid.', Mika: 'Smoothie for me! Race you!' }, emote: 'thumbs', act: 'coffee', topic: 'our coffee run' };
const BYE = { t: '👋 See you later', say: 'Catch you later!', react: { Pixel: 'Later, boss! *finger guns*', Jun: 'Bye! *tidy wave*', Sage: 'Until next time, Calvin.', Mika: 'Byeee! *headphones back on*' }, emote: 'shywave', end: true };

// evening by the campfire / asleep in bed: cozy, sleepy lines only (no work topics, no office invites)
const NIGHT_TALK = {
  home: { Pixel: ['Long day, boss. This fire is the best respawn point.', 'I toasted a marshmallow to a perfect golden brown. Speedrun record.'], Jun: ['Look at the sky, Calvin! I want to paint it.', 'The fireflies are out. I love this part of the day.'],
    Sage: ['Evenings are for slow thoughts. Sit with us?', 'I like how quiet it gets out here.'], Mika: ['Shh… listen. Crickets make a great beat.', 'Garden check: tomatoes are thriving! 🍅'] },
  sleep: { Pixel: ['*yawn* …boss? Is it morning? …nope. Zzz.', 'mm… saved my game… night…'], Jun: ['*rubs eyes* …night, Calvin… sweet dreams…', 'zzz… soft brushes… zzz'],
    Sage: ['*half asleep* …we can discuss it tomorrow… zzz', 'Rest is productive too, Calvin… zzz'], Mika: ['*mumbles* …lullaby remix… zzz', 'mm… night night, boss…'] } };
function nightRoot(n, ctx, act) { const asleep = ctx.asleep?.(n); const say = pick(NIGHT_TALK[asleep ? 'sleep' : 'home'][n]);
  const replies = asleep ? [{ t: '🌙 Sweet dreams', react: { Pixel: 'zzz… you too… boss…', Jun: '…mm… night… 💤', Sage: '…goodnight, Calvin.', Mika: '…zzz 🎶' }, emote: 'nod', end: true },
      { t: '🤫 Tiptoe out', react: { Pixel: '*snore*', Jun: '*tiny snore*', Sage: '*breathes slowly*', Mika: '*hums*' }, emote: 'nod', end: true }]
    : [{ t: '🔥 Sit by the fire', react: { Pixel: 'Pull up a log, boss!', Jun: 'Yay! Cozy squad!', Sage: 'Good choice.', Mika: 'I\'ll play something soft.' }, emote: 'shywave' },
      { t: '😴 Early night tonight', react: { Pixel: 'Same. My bed is calling.', Jun: 'Sleep well, Calvin!', Sage: 'Wise. See you at nine.', Mika: 'Night night, boss!' }, emote: 'wave', topic: 'an early night' },
      { t: '✨ Lovely evening', react: { Pixel: 'Best part of the day!', Jun: 'The fireflies agree!', Sage: 'It really is.', Mika: 'Ten out of ten vibes.' }, emote: 'nod' }];
  return { say, emote: asleep ? null : 'shywave', choices: [...replies.map(c => ({ ...c, topic: c.topic || 'a quiet night' })), BYE] }; }
export function buildRoot(n, ctx) {
  { const act = ctx.act?.(n); if (act === 'home' || act === 'sleep') return nightRoot(n, ctx, act); }
  const P = ctx.persona(n); const topics = [];
  const m = mem.get(n); if (m && Date.now() - m.at > 30000) topics.push({ w: 3, say: REMEMBER[n](m.topic), emote: 'nod', replies: [
    { t: '😄 Tell me more!', react: { Pixel: 'I added a secret level because of it!', Jun: 'I made three variants. You\'ll love #2.', Sage: 'I think it\'s a small bet with a big upside.', Mika: 'I cut a 15-second teaser of it!' }, emote: 'jump' },
    { t: '🤔 Remind me?', react: { Pixel: 'Boss! You forgot?! *dramatic gasp*', Jun: 'Hmm, I\'ll make you a sticky note.', Sage: 'Memory is a muscle, Calvin.', Mika: 'Wow. Okay. I\'ll pretend I\'m not hurt 😆' }, emote: 'laugh' }] });
  const task = ctx.task(n); if (task) topics.push({ w: 2, say: { Pixel: `I'm deep in "${task}". It's going great. Mostly.`, Jun: `Working on "${task}". Every pixel counts.`, Sage: `Today: "${task}". Lots to weigh up.`, Mika: `I'm on "${task}". The beat drops at 1:12!` }[n], emote: 'thumbs', topic: task, replies: [
    { t: '🙌 Proud of you!', react: { Pixel: 'Aww boss! High five! ✋', Jun: '*blushes* Thank you!', Sage: 'That means a lot, Calvin.', Mika: 'Okay I\'m putting that in the credits.' }, emote: 'highfive', hf: true },
    { t: '⏰ How long till done?', react: { Pixel: 'Two hours. In game-dev time, so… two days.', Jun: 'Done when it\'s pixel-perfect. Soon!', Sage: 'Ask me after one more data point.', Mika: 'Rendering says 3 minutes. It lies.' }, emote: 'laugh' }] });
  const hb = pick(P.hobbies); topics.push({ w: 1, say: { Pixel: `Did you know I'm into ${hb.toLowerCase()}? Total stress relief.`, Jun: `Lately I'm into ${hb.toLowerCase()}. So calming.`, Sage: `My weekend plan: ${hb.toLowerCase()}.`, Mika: `I've been obsessed with ${hb.toLowerCase()}!` }[n], emote: 'nod', topic: hb.toLowerCase(), replies: [
    { t: '✨ Show me sometime!', react: { Pixel: 'Deal! Bring snacks.', Jun: 'I\'ll make you a little zine!', Sage: 'I\'d like that. Bring a question.', Mika: 'Front-row seat, reserved!' }, emote: 'jump' },
    { t: '😅 Not my thing', react: { Pixel: 'Your loss! *sticks tongue out*', Jun: 'That\'s okay, more for me.', Sage: 'Fair. Diversity of interests is healthy.', Mika: 'I\'ll convert you eventually 😏' }, emote: 'laugh' }] });
  const zone = ctx.zone(n); if (WHERE[zone]) topics.push({ w: 2, say: WHERE[zone][n], emote: 'laugh', topic: 'the ' + zone, replies: [
    { t: '😂 Classic you', react: () => pick(LAUGH), emote: 'laugh' }, { t: '🙂 Carry on!', react: { Pixel: 'Yes boss! *salutes*', Jun: 'Will do!', Sage: 'Thank you, Calvin.', Mika: 'Rock on 🤘' }, emote: 'thumbs' }] });
  const cs = ctx.calvinState(); if (cs && CALVIN_STATE[cs]) topics.push({ w: 3, say: CALVIN_STATE[cs][n], emote: 'jump', topic: cs === 'cat' ? 'Mochi the cat' : cs === 'mug' ? 'coffee' : 'the cozy sofa', replies: [
    { t: '😎 Perks of being the boss', react: () => pick(LAUGH), emote: 'laugh' }, { t: '🤫 Our secret', react: { Pixel: '🤐 Locked.', Jun: '*zips lips*', Sage: 'Discretion is my specialty.', Mika: 'Secret soundtrack it is.' }, emote: 'nod' }] });
  topics.push({ w: 1, say: TOD[timeOfDay()][n], emote: 'shywave', topic: 'our ' + timeOfDay() + ' chat', replies: [
    { t: '☀️ Same here!', react: { Pixel: 'Team spirit! ✋', Jun: 'Matching energy!', Sage: 'Good to be in sync.', Mika: 'Duet!' }, emote: 'highfive', hf: true },
    { t: '😴 Need more sleep', react: { Pixel: 'Coffee fixes that. Trust me.', Jun: 'Take a stretch break! I\'ll join.', Sage: 'Sleep is the cheapest performance upgrade.', Mika: 'I\'ll play you something chill.' }, emote: 'nod' }] });
  // weighted pick
  const tot = topics.reduce((s, x) => s + x.w, 0); let r = Math.random() * tot, tp = topics[0]; for (const x of topics) { if ((r -= x.w) < 0) { tp = x; break; } }
  return { say: tp.say, emote: tp.emote, choices: [...tp.replies.map(c => ({ ...c, topic: tp.topic })), ACTIVITY[n], COFFEE, { t: '💬 Open chat', act: 'chat' }, BYE].slice(0, 5) };
}
// Group moment: Calvin joins 2+ bots. One bot invites him in, he picks, another reacts.
const GROUP_OPEN = ['Calvin! We were just talking about you. Good things!', 'Boss joined the party! 🎉', 'Calvin, settle a debate: pineapple on pizza?', 'Perfect timing, Calvin — we need a tie-breaker!', 'Calvin! Tell us a joke, we\'re bored.'];
export function buildGroup(names) { const a = pick(names), b = pick(names.filter(x => x !== a));
  return { speaker: a, say: pick(GROUP_OPEN), emote: 'jump', choices: [
    { t: '🍍 Pineapple: yes!', react: 'Boss has spoken! 🍍 The office is now a pineapple office.', reactor: b, emote: 'laugh', all: 'laugh' },
    { t: '🤡 Why did the dev go broke? He used up all his cache.', react: 'HAHAHA. Okay. That was terrible. I love it.', reactor: b, emote: 'laugh', all: 'laugh' },
    { t: '✋ Group high five!', react: 'Team high five! ✋✋✋', reactor: b, emote: 'highfive', all: 'highfive', hf: true },
    { t: '👋 Just passing by', react: 'Don\'t be a stranger!', reactor: b, emote: 'shywave', end: true }] }; }
export const pickLine = (x, n) => typeof x === 'function' ? x() : (x && typeof x === 'object' ? x[n] : x);
