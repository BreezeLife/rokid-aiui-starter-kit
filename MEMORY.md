# Durable decisions

- 2026-10-23: The user approved a separate Starter Kit project paired with their existing Rokid AIUI Agent DevKit Skill; demos are ordinary AIUI projects, not additional Skills.
- 2026-10-23: Start with Cook Along (offline) and Style Lens (vision API), with room to later add Stay Guide and City Scout.
- 2026-10-23: Provide equivalent English, Simplified Chinese, and Japanese README onboarding and explain each demo's functions, dependencies, modification points, and observed verification status.
- 2026-10-23: Each `demos/<name>/app/` must be complete and independently importable. Backend, tests, packages, and reports stay outside the import roots.
- 2026-10-23: Initial delivery is local. A proposed GitHub repository name is not evidence of publication. No credentials are committed and no live paid model request is assumed authorized.
- 2026-10-23: The first local delivery passed 38 tests, strict validation and AIX pack/list, while unmodified Ink 0.19 browser preview failed before app loading. Keep this preview failure distinct from modified-runtime diagnostic observations and from Studio/device acceptance; see verification/README.md.
- 2026-10-23: Style Lens defaults to Sample. Provider credentials stay in the separate server; the extractable app team token is temporary and expires server-side within 24 hours. A configured app is a private team copy, not the public starter.
- 2026-10-23: The user authorized creating a new GitHub repository after function/UI review and explicitly requested visible README screenshots. Publish the Starter Kit under BreezeLife with portable clone/import instructions, screenshots labeled as diagnostic, and unchanged distinctions between local checks and Studio/device/live-provider acceptance.
