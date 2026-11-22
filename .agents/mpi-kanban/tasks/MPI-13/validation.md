# MPI-13 validation

- 2026-11-22: `npm run check` 0; `node tools/golden.mjs` identical (2,934 drawings, widest 92,553); `claude plugin test ./muki-pet` 32/32; `claude plugin validate ./muki-pet` passes; all files LF.
- Repo: github.com/MadPonyInteractive/muki-pet (private), origin repointed, fetch works.
- `~/.claude/settings.json` CLAUDE_CODE_PLUGIN_DIRS now ends in `/muki-pet`; JSON valid.
- Left as history: docs/log, docs/handoffs and old card files still say eyebot.
- Fabio, 2026-11-22: Muki shows in a brand-new chat. The chat open during the rename lost him after `/reload-plugins` (9 plugins, 1 load error): open chats keep the CLAUDE_CODE_PLUGIN_DIRS path they started with.
