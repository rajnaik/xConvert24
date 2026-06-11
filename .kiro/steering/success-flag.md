# Visual Signals — Completion & Approval Banners

## Success Flag

When a task or steering command completes **successfully**, always end the response with the green flag banner:

```
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
✅ **DONE**
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
```

### Rules

1. Show the flag ONLY on success — not on failures, partial completions, or when asking questions.
2. Show it at the very end of the response, after any summary text.
3. Applies to all steering commands (HACK, CHOP, Prettify, Full Throttle, etc.) and any well-defined task the user asks to complete.
4. Does NOT apply to conversational Q&A, clarification responses, or mid-task progress updates.

---

## Approval Required Flag

When a task is **blocked waiting for user approval** (e.g., pre-write hook confirmation, destructive action, deploy approval), display the red banner:

```
🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥
🛑 **APPROVAL REQUIRED**
🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥
```

### Rules

1. Show BEFORE the question (so it's visually obvious the user needs to act).
2. Use whenever the response requires a reply from the user — whether it's a write approval, design question, clarification, or any decision point.
3. Applies to: ALL questions or prompts that need user input before proceeding. This includes casual questions, design choices, confirmations, and approvals.
4. Does NOT apply to purely informational responses where no reply is needed.
