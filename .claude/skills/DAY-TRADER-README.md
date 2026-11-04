# Day Trader skills (vendored)

The `trader-*` folders here come from
https://github.com/Jakeschincariol/day-trader-skill (commit 3d0f4ef, MIT, see `DAY-TRADER-LICENSE`).
They are project-local Claude Code skills: `/trader-scanner`, `/trader-news`, `/trader-entry`,
`/trader-exit`, `/trader-timemachine`, `/trader-risk`, `/trader-budget`, `/trader-broker`,
`/trader-alerts`, `/trader-analyst`, `/trader-pelosi`.

Needs Python 3.8+ (standard library only). SEC tools need `SEC_USER_AGENT="Your Name you@example.com"`.
Output goes to a `trader/` folder. Not financial advice; paper trading is the default.
To update: re-copy the `trader-*` folders from the upstream repo.
