# chibi-office

## Live status feed (`public/status.json`)

Each bot (`pixel`, `jun`, `sage`, `mika`) has an entry `{ state, task, updatedAt }`, where `state` is `working | idle | chatting | away | sleeping`. The office fetches the file every 60 s. An entry updated less than **30 min** ago overrides the clock routine: `working` puts the bot at its desk with the task on its name card, `chatting` sends it to the lounge/meeting area, `idle` sends it to the pantry, `away` sends it home, and `sleeping` follows the normal night routine. Fresh entries show a green **live** dot on the name card. Stale entries fall back to the clock.

To update an entry (a bot, a cron job, or a GitHub Action can all do this):

```sh
node scripts/set-status.mjs pixel working "Chibi office restyle"
git commit -am "status: pixel working" && git push origin main   # Pages redeploys; clients see it within ~1 min
```

The script needs no dependencies and only rewrites that bot's entry, stamping `updatedAt` with the current time. A routine should re-run it about every 20 min while the work continues, or the entry goes stale and the bot returns to its schedule.
