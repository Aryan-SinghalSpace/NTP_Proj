# Traceability Platform — Project Kit

This is your project starter kit for working with **Claude Code**.

## What's in here

```
.
├── CLAUDE.md            # Short briefing — Claude Code auto-loads this every session
├── README.md            # This file
└── docs/
    ├── PRD.md           # Full Product Requirements Document
    └── decisions.md     # Append-only log of decisions
```

## How to use it

### 1. Set up the project folder

On your computer:

```bash
mkdir traceability-platform
cd traceability-platform
```

Copy the contents of this kit (`CLAUDE.md`, `docs/`) into that folder.

### 2. Initialize git

```bash
git init
git add .
git commit -m "Initial project kit: PRD, decisions log, briefing"
```

### 3. Install Claude Code

Follow the install instructions at the Anthropic docs (you have a Claude.ai Pro / API access). Once installed:

```bash
cd traceability-platform
claude
```

Claude Code will detect `CLAUDE.md` and load it automatically. You don't need to paste anything in.

### 4. Start a session

Try something like:

> "Read CLAUDE.md and docs/PRD.md, then propose the initial tech-stack decision for this project. I want options for backend, datastore, queue, and frontend framework, with tradeoffs for each."

Or:

> "Start with the Architecture Document. Read CLAUDE.md and the PRD, then draft a docs/architecture.md covering the system topology, the workflow engine internals, and the multi-tenant data partitioning strategy."

### 5. After each session

- Review the changes Claude Code made.
- `git commit` what you want to keep.
- If a new decision was made, append it to `docs/decisions.md`.
- If a new doc was produced (architecture, data model, security), make sure CLAUDE.md references it.

## Working style

- **Use plan mode for non-trivial features** — Claude Code will write a plan, you approve it, then it executes. Saves a lot of rework.
- **Commit early, commit often.** Every meaningful chunk of work gets its own commit. This is your safety net.
- **Don't let CLAUDE.md drift.** When something significant changes, update CLAUDE.md so future sessions inherit the change.
- **Treat decisions.md as a log, not a doc.** Append, never edit (except typos). The history is the value.

## Tips

- If a session is getting long or losing focus, exit and start a fresh one. Claude Code reloads CLAUDE.md cleanly.
- For deep work on one area (e.g., the workflow engine), it can help to write a short `docs/workflow-engine.md` first and have Claude Code reference it.
- If you have a teammate joining, they only need this folder — everything they need to be productive is in here.
