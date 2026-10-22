#!/usr/bin/env node
// Update one bot's live entry in public/status.json (no dependencies).
//   node scripts/set-status.mjs <pixel|jun|sage|mika> <working|idle|chatting|away|sleeping> ["task text"]
// Then commit + push to main; GitHub Pages redeploys and every open office picks it up within ~60 s.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const BOTS = ['pixel', 'jun', 'sage', 'mika'], STATES = ['working', 'idle', 'chatting', 'away', 'sleeping'];
const [bot, state, ...rest] = process.argv.slice(2); const id = (bot || '').toLowerCase();
if (!BOTS.includes(id) || !STATES.includes(state)) { console.error(`usage: node scripts/set-status.mjs <${BOTS.join('|')}> <${STATES.join('|')}> ["task"]`); process.exit(1); }
const file = fileURLToPath(new URL('../public/status.json', import.meta.url));
let j = {}; try { j = JSON.parse(readFileSync(file, 'utf8')); } catch { }
j.bots ||= {}; const prev = j.bots[id] || {};
j.bots[id] = { state, task: rest.length ? rest.join(' ') : (prev.task || ''), updatedAt: new Date().toISOString() };
writeFileSync(file, JSON.stringify(j, null, 2) + '\n');
console.log(`${id}: ${state} — ${j.bots[id].task} (${j.bots[id].updatedAt})`);
