// Grok Bot agent deep links per chibi. Add Sage/Mika here when their chibis exist.
export const AGENTS = {
  Pixel: 'dfe047e8-ff80-4765-b3e5-4c76564a899f',
  Jun: 'cf939d1a-6290-476f-97d2-dd202a5f7942',
  Sage: 'cb566f14-945a-4592-a0b4-d72873974b1f',
  Mika: 'ce7975a8-12e7-4658-8e17-93ff6766d07a',
};
export const chatLink = name => AGENTS[name] ? `grokbot://app/v1/agent?id=${AGENTS[name]}` : null;
