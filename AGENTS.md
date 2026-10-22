# Contributor instructions

Read PROJECT.md, MEMORY.md, TASKS.md, and WORKLOG.md before significant changes. Keep durable decisions and actual verification results in these files.

Use the installed `rokid-aiui-agent` Skill for AIUI creation, modifications, debugging, and verification. If it is unavailable, follow the root README installation steps; never claim it was loaded merely because it was installed. Its canonical repository is https://github.com/BreezeLife/rokid-aiui-agent-skill . State the resolved Skill path when starting AIUI work.

Explain affected files before editing. Keep changes incremental and respect existing work. Each `demos/<name>/app/` is a complete AIUI Studio import root, targets 0.19.0, and must not import files from sibling demos or parent directories. Backend code, development tests, reports, credentials, and generated archives stay outside app roots. Each app's AGENTS.md describes that runtime Agent, not the coding assistant.

Keep English, Chinese, and Japanese READMEs equivalent for commands, paths, requirements, and verification limits. Do not hardcode machine-specific paths in public docs. Use ordinary project instructions and prompts; do not create a new Skill per demo.

Before completion, run behavioral tests, strict target-version validation, fingerprint and capability inventory, and supported AIX pack/list. Keep project-specific UX and capability matrices and submission handoffs. Missing live API, Studio, or glasses checks remain BLOCKED. Actual preview failures remain visible. Never equate HTML export with rendered preview or claim full offline host launch from local-only app logic.
