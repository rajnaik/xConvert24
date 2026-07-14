# v1.21 Roadmap — The Living Scrabble Database

Theme: Turn competitive Scrabble data from static tables into a living, historical database that tracks change over time.

Last updated: July 14, 2026

---

## Build Order (priority sequence)

| # | Feature | Effort | Dependencies | Version | Status | Delivered |
|---|---------|--------|--------------|---------|--------|-----------|
| 1 | Monthly Snapshot Automation | 2h | Existing snapshot table | v1.21.0 | ✅ Done | v1.21.0 |
| 2 | Rating Changes & Movers | 3h | Snapshots populated | v1.21.0 | ✅ Done | v1.21.0 |
| 3 | Player Career Timelines | 4h | Multiple snapshots | v1.21.1 | ✅ Done (in player pages) | v1.21.0 |
| 4 | Country Statistics | 3h | Rankings data | v1.21.0 | ✅ Done | v1.21.0 |
| 5 | Records & Milestones | 3h | Snapshots + rankings | v1.21.2 | 🔲 Planned | — |
| 6 | Tournament History & Results | 4h | Tournaments table | v1.21.2 | 🔲 Planned | — |
| 7 | Player Detail Pages | 5h | All above | v1.21.0 | ✅ Done | v1.21.0 |
| 8 | Analytics Dashboard (public) | 5h | All above | v1.21.3 | 🔲 Planned | — |
| 9 | Historical Ranking Graphs | 4h | Snapshots + charting | v1.21.4 | 🔲 Planned | — |
| 10 | Public API v2 (history endpoints) | 3h | All above | v1.21.0 | ✅ Done (movers + countries) | v1.21.0 |

**Total estimated: ~36 hours**

---

## Feature Specs

### 1. Monthly Snapshot Automation

**What:** Automated monthly snapshot that saves all rankings to `ranking_snapshots` at the start of each month.

**How:** Worker cron trigger (1st of each month) reads all active `player_rankings` and bulk-inserts into `ranking_snapshots`. Falls back to manual "Take Snapshot" button on admin (already exists).

**Schema:** Existing `ranking_snapshots` table is sufficient. Add an index:

```sql
CREATE INDEX IF NOT EXISTS idx_snapshots_player ON ranking_snapshots(player_name, ranking_type);
```

**Acceptance criteria:**
- Cron fires monthly and inserts 50+ rows per ranking type
- Admin can trigger manual snapshot at any time
- Duplicate protection: skip if snapshot for this month already exists

---

### 2. Rating Changes & Movers

**What:** Show rating change (+/-) next to each player in the rankings table. "Biggest Movers" section showing top 5 risers and top 5 fallers since last snapshot.

**How:** Compare current `player_rankings.rating` against the most recent `ranking_snapshots` entry for each player. Calculate delta.

**New table:**

```sql
CREATE TABLE IF NOT EXISTS rating_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  ranking_type TEXT NOT NULL DEFAULT 'wespa',
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  rank_before INTEGER NOT NULL,
  rank_after INTEGER NOT NULL,
  change_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_changes_player ON rating_changes(player_name, ranking_type);
CREATE INDEX IF NOT EXISTS idx_changes_date ON rating_changes(change_date DESC);
```

**UI additions:**
- Rankings table: green/red arrow + delta number next to rating
- New "🔥 Biggest Movers" card on world-rankings page (top 5 up, top 5 down)
- Period selector: "vs last month" / "vs 3 months ago" / "vs 6 months ago"

**API:** `GET /api/public/movers/?period=1m` → returns top risers/fallers

---

### 3. Player Career Timelines

**What:** For any player, show their rating over time as a data series (suitable for charting).

**How:** Query `ranking_snapshots` for a given player, ordered by date. Return as JSON array of `{date, rating, rank}`.

**No new tables needed** — uses `ranking_snapshots`.

**API:** `GET /api/public/player/:name/history/` → returns:
```json
{
  "player": "David Eldar",
  "country": "Australia",
  "timeline": [
    {"date": "2026-01-01", "rating": 2130, "rank": 1},
    {"date": "2026-02-01", "rating": 2138, "rank": 1},
    {"date": "2026-07-01", "rating": 2145, "rank": 1}
  ]
}
```

**UI:** Sparkline or mini chart on the player profile card showing rating trend.

---

### 4. Country Statistics

**What:** Aggregate rankings by country. Show: total players, average rating, highest-rated player, total titles, representation percentage.

**New table:**

```sql
CREATE TABLE IF NOT EXISTS country_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  total_players INTEGER NOT NULL DEFAULT 0,
  avg_rating INTEGER NOT NULL DEFAULT 0,
  top_player TEXT DEFAULT '',
  top_rating INTEGER DEFAULT 0,
  total_titles INTEGER DEFAULT 0,
  ranking_type TEXT NOT NULL DEFAULT 'wespa',
  snapshot_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_country_stats_date ON country_stats(snapshot_date, ranking_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_country_stats_unique ON country_stats(country_code, ranking_type, snapshot_date);
```

**UI:** New tab or section on world-rankings: "🌍 Country Leaderboard"
- Table: Country | Players | Avg Rating | Top Player | Titles
- Sortable by any column
- Drill-down: click country → see all players from that country

**API:** `GET /api/public/countries/?type=wespa` → country stats array

---

### 5. Records & Milestones

**What:** A curated "Records" section showing all-time bests and notable achievements.

**New table:**

```sql
CREATE TABLE IF NOT EXISTS scrabble_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  record_name TEXT NOT NULL,
  record_value TEXT NOT NULL,
  holder_name TEXT DEFAULT '',
  holder_country TEXT DEFAULT '',
  achieved_date TEXT DEFAULT '',
  source TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Seed data categories:**
- `rating` — Highest WESPA rating ever, Highest peak, Longest at #1
- `tournament` — Most titles, Highest single-game score, Highest tournament average
- `career` — Most games played, Longest career, Most countries represented
- `improvement` — Biggest rating jump (1 month), Biggest rank climb (1 year)

**UI:** Dedicated "🏅 Records" section/tab on world-rankings
- Card grid showing each record with holder name, value, date
- Animated gold border on the all-time #1

**API:** `GET /api/public/records/` → all records

---

### 6. Tournament History & Results

**What:** Expand the existing `tournaments` table to store past results with winner, runner-up, final scores, and link back to player profiles.

**New table (extends existing):**

```sql
CREATE TABLE IF NOT EXISTS tournament_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER REFERENCES tournaments(id),
  position INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  country_code TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  spread INTEGER DEFAULT 0,
  rating_before INTEGER DEFAULT 0,
  rating_after INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_results_tournament ON tournament_results(tournament_id, position);
CREATE INDEX IF NOT EXISTS idx_results_player ON tournament_results(player_name);
```

**UI:**
- Expandable tournament cards showing top 3 (or top 10 for majors)
- Click "Full Results →" to see the entire field
- Player names link to player profiles

**API:** `GET /api/public/tournaments/:id/results/` → full result set

---

### 7. Player Detail Pages

**What:** Dedicated page per player at `/players/:slug/` showing career summary, timeline, tournament history, records held, and country context.

**No new tables** — aggregates from existing data.

**Page structure:**
```
/players/david-eldar/
├── Hero: Name, country, current rank, current rating, peak
├── Career Timeline: Rating graph over time
├── Tournament Results: Table of events with position, rating change
├── Records Held: Any records this player holds
├── Head-to-Head: (future — if we track game-level data)
└── API link: /api/public/player/david-eldar/
```

**Generates from:** `player_rankings` + `ranking_snapshots` + `tournament_results` + `scrabble_records`

**SEO value:** High. Individual player pages rank for "[Player Name] Scrabble" queries.

---

### 8. Analytics Dashboard (Public)

**What:** A public `/analytics/` or `/stats/` page showing global Scrabble statistics and trends.

**Sections:**
- Rating distribution chart (histogram: how many players at each 100-point band)
- Country representation pie/bar chart
- Tournament frequency by month
- Average rating trend over time (global)
- Most active players (by games played this year)
- Newest entrants to the top 50

**No new tables** — purely computed from existing data.

**UI:** Visual-heavy page with CSS-only charts (no JS charting library needed for MVP — use Tailwind percentage bars). Can add Chart.js later if needed.

---

### 9. Historical Ranking Graphs

**What:** Interactive line chart showing how rankings have shifted over time. X-axis = months, Y-axis = rating. Show top 5-10 players as coloured lines.

**Implementation options:**
1. **CSS-only sparklines** (MVP — simple, no dependencies)
2. **Chart.js via CDN** (richer, interactive tooltips)
3. **SVG generated server-side** (fast, no client JS)

**Recommendation:** Start with option 3 (server-rendered SVG). Generate `<svg>` path elements from snapshot data in the Astro frontmatter. Add Chart.js later for interactivity if needed.

**Placement:** New tab "📈 Trends" on world-rankings page.

---

### 10. Public API v2 (History Endpoints)

**New endpoints:**

| Endpoint | Returns |
|----------|---------|
| `GET /api/public/movers/` | Top risers/fallers (period param) |
| `GET /api/public/player/:name/history/` | Rating timeline for one player |
| `GET /api/public/countries/` | Country-level aggregates |
| `GET /api/public/records/` | All-time records |
| `GET /api/public/tournaments/:id/results/` | Full tournament result set |
| `GET /api/public/trends/` | Global rating trends over time |

All cached (5 min TTL), CORS-enabled, documented on `/developers/`.

---

## Database Schema Summary (new tables for v1.21)

```sql
-- 1. Rating changes (computed from snapshots)
CREATE TABLE IF NOT EXISTS rating_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  ranking_type TEXT NOT NULL DEFAULT 'wespa',
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  rank_before INTEGER NOT NULL,
  rank_after INTEGER NOT NULL,
  change_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_changes_player ON rating_changes(player_name, ranking_type);
CREATE INDEX IF NOT EXISTS idx_changes_date ON rating_changes(change_date DESC);

-- 2. Country statistics (aggregated monthly)
CREATE TABLE IF NOT EXISTS country_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  total_players INTEGER NOT NULL DEFAULT 0,
  avg_rating INTEGER NOT NULL DEFAULT 0,
  top_player TEXT DEFAULT '',
  top_rating INTEGER DEFAULT 0,
  total_titles INTEGER DEFAULT 0,
  ranking_type TEXT NOT NULL DEFAULT 'wespa',
  snapshot_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_country_stats_date ON country_stats(snapshot_date, ranking_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_country_stats_unique ON country_stats(country_code, ranking_type, snapshot_date);

-- 3. Scrabble records (manually curated + auto-detected)
CREATE TABLE IF NOT EXISTS scrabble_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  record_name TEXT NOT NULL,
  record_value TEXT NOT NULL,
  holder_name TEXT DEFAULT '',
  holder_country TEXT DEFAULT '',
  achieved_date TEXT DEFAULT '',
  source TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 4. Tournament results (detailed placements)
CREATE TABLE IF NOT EXISTS tournament_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER REFERENCES tournaments(id),
  position INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  country_code TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  spread INTEGER DEFAULT 0,
  rating_before INTEGER DEFAULT 0,
  rating_after INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_results_tournament ON tournament_results(tournament_id, position);
CREATE INDEX IF NOT EXISTS idx_results_player ON tournament_results(player_name);

-- 5. Index on existing ranking_snapshots for player lookup
CREATE INDEX IF NOT EXISTS idx_snapshots_player ON ranking_snapshots(player_name, ranking_type);
```

---

## What This Unlocks

Once v1.21 is complete, the site has:

- **Temporal depth** — not just "who's #1 now" but "how did they get there"
- **Discovery paths** — browse by country, by record, by tournament, by time period
- **Citeable data** — researchers/journalists can reference historical trends
- **API consumers** — developers can build visualisations on top of the data
- **SEO multiplier** — individual player pages, country pages, records pages = hundreds of new indexable URLs
- **Repeat visits** — "Biggest Movers this month" gives users a reason to come back

---

## What We're NOT Building in v1.21

- ❌ Multiplayer games (Phase 2)
- ❌ AI model routing (deferred to v1.22)
- ❌ More blog content (maintenance only)
- ❌ New games or activities
- ❌ xConvert features

Single theme. Deep execution. Authority builder.

---

## Agent Attribution

Created by **kiro**, July 14, 2026.
