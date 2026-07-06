# SWF Roadmap — Games & AI Intelligence Upgrades

Living document tracking planned multiplayer games and AI chatbot (Lex) upgrades.
Last updated: July 6, 2026 (v1.19.0)

## AI Intelligence Upgrades (Lex Chatbot)

### Status Key: 🔲 Planned | 🔨 In Progress | ✅ Done

### Model Routing (Foundation)
| # | Feature | Status | Version | Date | Notes |
|---|---------|--------|---------|------|-------|
| 2a | Query Classifier | 🔨 | — | Target: v1.21 | Categorise messages: simple → 8B, complex → 70B |
| 2b | Unified Chat Router | 🔲 | — | Target: v1.22 | Single entry point routes to appropriate model |
| 2c | Latency Fallback | 🔲 | — | Target: v1.22 | 70B timeout → graceful 8B fallback |

### Rack Quality Scoring
| # | Feature | Status | Version | Date | Notes |
|---|---------|--------|---------|------|-------|
| 3a | EV Scoring Engine | ✅ | v1.16.0 | Jun 28, 2026 | Score 0-100: vowel/consonant ratio, power tiles, bingo stems, dupes |
| 3b | Rack Leave Comparator | ✅ | v1.17.0 | Jul 2, 2026 | Compare multiple plays by resulting leave quality |
| 3c | Historical Percentile | 🔲 | — | Target: v1.23 | Monte Carlo sampling, place rack in distribution |
| 3d | Integration into Lex | 🔨 | — | Target: v1.21 | Wire EV into solver/chat prompts |

### Training Modes
| # | Feature | Status | Version | Date | Notes |
|---|---------|--------|---------|------|-------|
| 1a | Bingo Trainer | 🔨 | — | Target: v1.20 | Random bingo-stem rack, user guesses, Lex confirms. Bingo detection added v1.19. |
| 1b | Hook Quiz | 🔲 | — | Target: v1.24 | Pick word, calc all valid hooks, user guesses |
| 1c | Tile Countdown | 🔲 | — | Target: v1.25 | N moves played, quiz remaining tile counts |
| 1d | Rack Leave Drill | 🔲 | — | Target: v1.24 | Present 2-3 plays, user picks best leave |

### Post-Game Analysis
| # | Feature | Status | Version | Date | Notes |
|---|---------|--------|---------|------|-------|
| 4a | Game Transcript Parser | 🔲 | — | Target: v1.26 | Accept move list: rack + played word + score |
| 4b | Best Move Solver | 🔲 | — | Target: v1.26 | Solve each turn, compare to actual play |
| 4c | Pattern Detection | 🔲 | — | Target: v1.27 | Recurring weaknesses: missed bingos, poor leaves, etc. |
| 4d | AI Game Report | 🔲 | — | Target: v1.28 | 70B narrative coaching report |
| 4e | Game Input UI | 🔲 | — | Target: v1.26 | Page/panel for entering game transcript |

---

## Games — Shipped

| Game | Version | Date | Notes |
|------|---------|------|-------|
| 60-Second Word Finder | v1.12.0 | Jun 22, 2026 | Timed word game with leaderboard |
| Cows & Bulls | v1.14.0 | Jun 25, 2026 | Mastermind-style word deduction |
| Daily Rack Challenge | v1.10.0 | Jun 20, 2026 | Daily shared rack, compete on score |
| Daily Anagram | v1.10.0 | Jun 20, 2026 | Daily scrambled word challenge |
| Word Quiz | v1.15.0 | Jun 27, 2026 | Knowledge quiz with Lex coaching |
| Diamond Hunt | v1.17.0 | Jul 2, 2026 | Find hidden diamonds across pages |
| Leaderboard (all games) | v1.13.0 | Jun 24, 2026 | Unified rankings with period filters |
| Badges & Progression | v1.18.0 | Jul 4, 2026 | Diamond-gated badge tiers |

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
- **Status: 🔲 Planned (Phase 2 — after matchmaking proven) | Target: v2.0**

#### Word Chain Duel
- Players alternate, each word starts with last letter of previous
- 30-second timer, no repeats, power-ups (freeze time once)
- 2-5 min matches, anonymous
- **Status: 🔨 In Progress (Phase 1 — simplest real-time game) | Target: v1.25**

#### Daily Duel
- Same letters for everyone, async, best score wins
- Extend existing Daily Rack with leaderboard + competitive framing
- **Status: 🔨 In Progress (Phase 1 — lowest effort) | Target: v1.20**

#### Word Poker
- 10 rounds × random rack → solve → sum scores
- No board, under 5 min, mobile-perfect
- Solo or async duel (both get same 10 racks)
- **Status: 🔲 Planned (Phase 1 — solo first, then competitive) | Target: v1.22**

### Tier 2 — Build After (Harder, needs infrastructure)

#### Territory
- 13×13 grid, place words claiming squares in your colour
- Surrounding captures enemy territory (needs rule refinement)
- Game ends when board fills, winner = most squares
- **Status: 🔲 Planned (Phase 2/3 — complex board rendering + capture logic) | Target: v2.x**

#### Shared Letter Board
- Central letter pool, players grab letters to form words
- Letters disappear and replenish (falling blocks style)
- Competitive Boggle — very addictive loop
- **Status: 🔲 Planned (Phase 2 — requires true real-time WebSocket) | Target: v2.x**

#### Letter Economy
- Every letter has market value, prices change based on global usage
- Players think economically — rare letters expensive
- Could work as single-player daily challenge first
- **Status: 🔲 Planned (Phase 3 — market simulation) | Target: v3.x**

### Tier 3 — Defer (Cool but lower priority)

| Game | Reason to Wait |
|------|---------------|
| Word Conquest | Mechanically just "longer word = more damage" — needs depth |
| Word Kingdom | Persistent state, needs large player base |
| Reverse Scramble | Niche, asymmetric, hard to explain |
| Hex Board | Beautiful but word direction on hexes = UX challenge |

---

## Technical Requirements for Multiplayer

| Component | Solution | Status |
|-----------|----------|--------|
| Real-time state | Durable Objects (per-game-room + WebSocket) | 🔲 Planned |
| Matchmaking | D1 queue with polling OR Durable Object matchmaker | 🔲 Planned |
| Game validation | SOWPODS dictionary (already have) | ✅ Done |
| Turn history | D1 table per game | ✅ Done (60sec, CaB, rack, anagram) |
| Leaderboards | D1 aggregates, KV cached | ✅ Done |
| Anonymous identity | Existing UUID (swf-uid) | ✅ Done |
| Player names | Static array: adjective + animal combos | ✅ Done (50 avatars + names) |
| Progression | Stars, diamonds, badges (existing system) | ✅ Done |

## Build Order

1. **AI Upgrades** (current sprint) — ~~Model Routing~~ → ~~Rack Quality~~ → Training Modes → Post-Game Analysis
2. **Phase 1 Games** — ~~Daily Rack~~ → ~~Daily Anagram~~ → Daily Duel (in progress) → Word Chain Duel (in progress) → Word Poker
3. **Phase 2 Games** — Word Clash (flagship)
4. **Phase 3 Games** — Territory, Shared Board, Letter Economy

---

## Version History (Milestones)

| Version | Date | Milestone |
|---------|------|-----------|
| v1.0.0 | Jun 13, 2026 | Initial launch — solver, SOWPODS dictionary |
| v1.10.0 | Jun 20, 2026 | Daily challenges (rack + anagram) |
| v1.12.0 | Jun 22, 2026 | 60-Second Word Finder game |
| v1.14.0 | Jun 25, 2026 | Cows & Bulls game |
| v1.15.0 | Jun 27, 2026 | Word Quiz + Lex coaching |
| v1.16.0 | Jun 28, 2026 | EV Score engine (rack quality 0-100) |
| v1.17.0 | Jul 2, 2026 | Diamond Hunt + Rack Leave analysis |
| v1.18.0 | Jul 4, 2026 | Badges, progression, avatar system |
| v1.19.0 | Jul 5, 2026 | Bingo detection, admin telemetry chart, blog quality |

## Agent Attribution

Created by **kiro**, July 2, 2026. Updated July 6, 2026.
