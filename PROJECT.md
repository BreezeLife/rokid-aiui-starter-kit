# Rokid AIUI Starter Kit

## Purpose
Give hackathon participants complete, editable AIUI 0.19.0 projects and a clear workflow: choose a demo, install the Rokid AIUI Agent DevKit Skill, modify the project with a coding agent, verify, then demonstrate.

## Architecture
- `demos/cook-along/app/`: standalone Studio import root for an offline recipe stepper and timer.
- `demos/style-lens/app/`: standalone Studio import root for sample advice and live garment-photo advice.
- `demos/style-lens/server/`: separately deployed vision API proxy; provider keys never belong in the AIUI app.
- Each demo owns its tests, README, submission preparation, verification artifacts, and `media/` walkthrough/source captures outside `app/`.
- Root README files in English, Simplified Chinese, and Japanese provide equivalent onboarding.
- The external `BreezeLife/rokid-aiui-agent-skill` is a development tool, not a runtime dependency. Do not duplicate its Skill package here.

## Boundaries
English application UI initially; documentation in three languages. No accounts, purchases, store submission, or always-on background work. Cook Along performs no external API requests after opening; offline host launch and device input require separate verification. Style Lens starts in visibly labeled Sample mode; Live mode requires a reachable configured backend, provider credentials, and camera authorization. Record test results honestly; preview, Studio, and glasses evidence are distinct.

## Version
Target AIUI 0.19.0. Official source snapshot: `7d62c2d9ac1cdc1389ba06ed0651b395903accff`. DevKit baseline: `d9fe8f9a82891640351cdcf5515b4c17689df95a`; see `verification/source-pins.json`. AIX commands are capability-probed before use.
