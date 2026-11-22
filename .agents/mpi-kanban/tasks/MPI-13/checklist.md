# MPI-13 checklist

Fabio, 2026-11-22: the robot is **Muki** (his first guinea pig); the project, repo and plugin are **muki-pet**.

- [x] GitHub repo renamed to MadPonyInteractive/muki-pet (private); origin repointed
- [x] `eyebot/` folder moved to `muki-pet/`; plugin name `muki-pet`
- [x] Display name "Eyebot" becomes "Muki" in code (alt text, comments)
- [x] Paths in package.json, tools/, docs, rules, profile, CLAUDE.md, README updated (history in docs/log and handoffs left as written)
- [x] `~/.claude/settings.json` CLAUDE_CODE_PLUGIN_DIRS points at `muki-pet`
- [x] Checks: npm run check 0, golden identical, plugin test, plugin validate
- [x] Commit and push
- [ ] Fabio types `/reload-plugins` (his saved home spot starts fresh once: the store file is named by plugin)
