# GitHub replacement and saved progress

Source: https://github.com/lluciper/farm, commit e4f35cd134a10ce7094d362f937acc640c93347c.

The new UI, artwork, character system and optional username/password accounts use that repository. Existing v58 farms run through `public/legacy-core.js`; `public/save-compat.js` dispatches by save format so existing XP, promotion gates, purchased plots, possessions and timers are retained. New saves use the GitHub engine. Product catalogs include both versions so later v58 items remain recognized. Browser and server use the same generated compatibility engines.

Existing D1 tables and migrations 0000–0004 stay unchanged. Migration 0005 adds accounts and sessions only. Account registration claims the original save key rather than copying or clearing the save. Guest secrets and the existing local cache key continue to work. Explicit old links take priority over a different device-held secret.

Checks: `node tests/save-compat.cjs`, `node tests/accounts.mjs`, `node tests/ui-smoke.cjs`, `node tests/sync-client.cjs`, `node tests/core.cjs`, `node tests/cards.cjs`, framework build, and `node tests/built-smoke.mjs`.

The compatibility fixture is synthetic, not a player's data. It covers level 700, 51 plots, possessions, a furnished home, a pet, and active kitchen, café, animal and fishing timers. Account tests verify unchanged payload during claiming and a subsequent save.

Production retains the same project, database, domain and old save keys. No game_saves rows are bulk-rewritten or deleted by this release.
