# SWF Roadmap — Games & AI Intelligence Upgrades

Living document tracking planned multiplayer games and AI chatbot (Lex) upgrades.

## AI Intelligence Upgrades (Lex Chatbot)

### Status Key: 🔲 Planned | 🔨 In Progress | ✅ Done

### Model Routing (Foundation)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 2a | Query Classifier | 🔲 | Categorise messages: simple → 8B, complex → 70B |
| 2b | Unified Chat Router | 🔲 | Single entry point routes to appropriate model |
| 2c | Latency Fallback | 🔲 | 70B timeout → graceful 8B fallback |

### Rack Quality Scoring
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3a | EV Scoring Engine | 🔲 | Score 0-100: vowel/consonant ratio, power tiles, bingo stems, dupes |
| 3b | Rack Leave Comparator | 🔲 | Compare multiple plays by resulting leave quality |
| 3c | Historical Percentile | 🔲 | Monte Carlo sampling, place rack in distribution |
| 3d | Integration into Lex | 🔲 | Wire EV into solver/chat prompts |

### Training Modes
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1a | Bingo Trainer | 🔲 | Random bingo-stem rack, user guesses, Lex confirms |
| 1b | Hook Quiz | 🔲 | Pick word, calc all valid hooks, user guesses |
| 1c | Tile Countdown | 🔲 | N moves played, quiz remaining tile counts |
| 1d | Rack Leave Drill | 🔲 | Present 2-3 plays, user picks best leave |

### Post-Game Analysis
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 4a | Game Transcript Parser | 🔲 | Accept move list: rack + played word + score |
| 4b | Best Move Solver | 🔲 | Solve each turn, compare to actual play |
| 4c | Pattern Detection | 🔲 | Recurring weaknesses: missed bingos, poor leaves, etc. |
| 4d | AI Game Report | 🔲 | 70B narrative coaching report |
| 4e | Game Input UI | 🔲 | Page/panel for entering game transcript |

---

## Multiplayer Game Concepts

### Tier 1 — Build First (High impact, achievable)

#### Word Clash (Raj's Original — Flagship)
- Players start with 7 letters, shared board (list-based or spatial TBD)
- Actions per turn: Build, Extend, Steal, Attack
- Steal mechanic: play SCAT over opponent's CAT → take ownership
- Counter-steal: play SCATTER over SCAT → take it back
- Short matches (~5 min), anonymous matchmaking
- Random animal names: Blue Fox, Red Panda, Silver Wolf, Golden Owl
- Progression: wins → stars, streaks → diamonds, Elo rating, seasonal leagues
- **Status: Planned (Phase 2 — after matchmaking proven)**

#### Word Chain Duel
- Players alternate, each word starts with last letter of previous
- 30-second timer, no repeats, power-ups (freeze time once)
- 2-5 min matches, anonymous
- **Status: Planned (Phase 1 — simplest real-time game)**

#### Daily Duel
- Same letters for everyone, async, best score wins
- Extend existing Daily Rack with leaderboard + competitive framing
- **Status: Planned (Phase 1 — lowest effort)**

#### Word Poker
- 10 rounds × random rack → solve → sum scores
- No board, under 5 min, mobile-perfect
- Solo or async duel (both get same 10 racks)
- **Status: Planned (Phase 1 — solo first, then competitive)**

### Tier 2 — Build After (Harder, needs infrastructure)

#### Territory
- 13×13 grid, place words claiming squares in your colour
- Surrounding captures enemy territory (needs rule refinement)
- Game ends when board fills, winner = most squares
- **Status: Planned (Phase 2/3 — complex board rendering + capture logic)**

#### Shared Letter Board
- Central letter pool, players grab letters to form words
- Letters disappear and replenish (falling blocks style)
- Competitive Boggle — very addictive loop
- **Status: Planned (Phase 2 — requires true real-time WebSocket)**

#### Letter Economy
- Every letter has market value, prices change based on global usage
- Players think economically — rare letters expensive
- Could work as single-player daily challenge first
- **Status: Planned (Phase 3 — market simulation)**

### Tier 3 — Defer (Cool but lower priority)

| Game | Reason to Wait |
|------|---------------|
| Word Conquest | Mechanically just "longer word = more damage" — needs depth |
| Word Kingdom | Persistent state, needs large player base |
| Reverse Scramble | Niche, asymmetric, hard to explain |
| Hex Board | Beautiful but word direction on hexes = UX challenge |

---

## Technical Requirements for Multiplayer

| Component | Solution |
|-----------|----------|
| Real-time state | Durable Objects (per-game-room + WebSocket) |
| Matchmaking | D1 queue with polling OR Durable Object matchmaker |
| Game validation | SOWPODS dictionary (already have) |
| Turn history | D1 table per game |
| Leaderboards | D1 aggregates, KV cached |
| Anonymous identity | Existing UUID (swf-uid) |
| Player names | Static array: adjective + animal combos |
| Progression | Stars, diamonds, badges (existing system) |

## Build Order

1. **AI Upgrades** (current sprint) — Model Routing → Rack Quality → Training Modes
2. **Phase 1 Games** — Daily Duel → Word Chain Duel → Word Poker
3. **Phase 2 Games** — Word Clash (flagship)
4. **Phase 3 Games** — Territory, Shared Board, Letter Economy

---

## Agent Attribution

Created by **kiro**, July 2, 2026.
