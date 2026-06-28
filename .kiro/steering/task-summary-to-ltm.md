---
inclusion: auto
name: task-summary-to-ltm
description: "Before starting any to-do task, write a summary to LTM context so there's a record of what was requested and the plan."
---

# Task Summary to LTM — First Step on Every To-Do

## Rule

When Raj submits a to-do request (a task to complete, a feature to build, a bug to fix, a command to execute), the **very first action** before any implementation is:

1. **Understand the task** — parse what Raj is asking, identify scope, success criteria, and affected files/areas.
2. **Write a summary to LTM** — log the task understanding to LTM so it's recoverable across sessions.

## How to Log

Run:
```bash
python3 ltm/bin/ltm.py checkpoint --from-json /tmp/task-summary.json
```

Or write directly to `ltm/store/events.jsonl` with this structure:

```json
{
  "type": "task_started",
  "timestamp": "<ISO 8601>",
  "summary": "<1-2 sentence summary of what Raj asked>",
  "scope": "<files/areas affected>",
  "success_criteria": "<what 'done' looks like>",
  "notes": "<any clarifications or assumptions>"
}
```

## What Counts as a "To-Do Request"

- "Build X feature"
- "Fix this bug"
- "Add Y to Z page"
- "Deploy to staging"
- "CHOP", "HACK", "Prettify", or any steering command
- "Create a new page/component/API"
- "Seed data for..."
- Any task that requires implementation steps

## What Does NOT Count

- Conversational questions ("What does X do?")
- Clarification requests ("Show me the current state of Y")
- Info lookups ("What's the latest version of Z?")
- Showing summaries ("Show blog ideas summary")

## Why

- Provides a paper trail of what was attempted each session
- Enables resume-from-where-we-left-off across sessions
- Catches misunderstandings early (writing the summary forces clarity)
- Feeds the LTM recall system so future sessions know past work

## Applies To

All workspaces. All agents. All to-do tasks.

## Agent Attribution

This is a **kiro** steering rule, created June 28, 2026.
