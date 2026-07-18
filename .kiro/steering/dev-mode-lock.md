# Dev Mode — Workspace Write Lock

Only ONE workspace may be written to at any time. All others are READ-ONLY until the user explicitly switches.

## How It Works

The user says **"Dev Mode [workspace]"** to unlock that workspace for writes. All other workspaces are immediately locked.

## Supported Workspaces

| Trigger Command | Workspace | Root Path | Unlocked For Writes |
|----------------|-----------|-----------|-------------------|
| `Dev Mode xconvert` | xConvert24 | `/Users/rajeevnaik/Code/xConvert.com/` (excluding `scrabblewordsfinder/` and `coins/` and `playground/` and `xsoft/`) | xConvert files only |
| `Dev Mode swf` | ScrabbleWordsFinder | `/Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder/` | SWF files only |
| `Dev Mode coins` | Crypto Coins | `/Users/rajeevnaik/Code/xConvert.com/coins/` | Coins files only |
| `Dev Mode playground` | Playground | `/Users/rajeevnaik/Code/xConvert.com/playground/` | Playground files only |
| `Dev Mode xsoft` | xSoft Ltd | `/Users/rajeevnaik/Code/xConvert.com/xsoft/` | xSoft files only |


## Rules

1. **Default state: ALL workspaces are LOCKED.** No writes without an active Dev Mode.
2. **Only one workspace can be in Dev Mode at a time.** Switching Dev Mode automatically locks the previous workspace.
3. **When a workspace is locked, Kiro/Henry MUST NOT:**
   - Create, edit, delete, or move any file in that workspace
   - Modify any config (wrangler, package.json, astro.config, etc.)
   - Run any command that writes to that workspace (migrations, wrangler d1 execute with INSERT/UPDATE/DELETE, etc.)
   - The ONLY exception is reading files for context or answering questions
4. **When a write is attempted on a locked workspace**, respond with:
   - "⛔ [Workspace] is currently LOCKED. Active Dev Mode: [active workspace or NONE]."
   - "Say `Dev Mode [workspace]` to switch."
5. **Steering files and hooks** (`.kiro/steering/`, `.kiro/hooks/`) are shared infrastructure and may be edited regardless of Dev Mode, since they govern all workspaces.
6. **If no Dev Mode is active**, all workspaces are locked. The user must explicitly activate one.
7. **Persistence is TTL-BASED (3 hours).** Once the user declares Dev Mode, it remains active for 3 hours from the last user interaction. New conversations within the TTL window inherit the active Dev Mode — do NOT ask the user to re-declare it. The TTL resets with each user message (sliding window).
8. **Auto-lock after 3 hours of inactivity.** If no user interaction occurs for 3 hours, all workspaces automatically return to LOCKED state. The user must re-declare Dev Mode after the timeout.

## State Tracking

When the user declares Dev Mode, acknowledge it clearly:
- "🔓 Dev Mode: xConvert24 — writes enabled for xConvert workspace. SWF is locked. (TTL: 3h)"
- "🔓 Dev Mode: SWF — writes enabled for ScrabbleWordsFinder. xConvert is locked. (TTL: 3h)"

## Future Workspaces

If new workspaces are added, they follow the same pattern:
- `Dev Mode [name]` unlocks that workspace
- All others lock
- Maximum one workspace writable at any time
