# Admin Pages — Standard Set for Every Workspace

Every workspace gets these admin pages. All protected by Google OAuth middleware.

## Dashboard Tiles (on /admin/)

| # | Tile | Page | Color | Purpose |
|---|------|------|-------|---------|
| 1 | 📧 Emails | `/admin/emails` | Blue | View/edit/delete contact + suggest submissions |
| 2 | 📊 Clicks | `/admin/clicks` | Emerald | Real-time click analytics, sound alerts, 1s refresh |
| 3 | 📡 Telemetry | `/admin/telemetry` | Cyan | Endpoint health monitoring, response times, history |
| 4 | 🌐 Environments | `/admin/environments` | Indigo | Dev/Staging/Live URLs + status checks |
| 5 | 🖼️ Banner Management | `/admin/banner-management` | Purple | Toggle banners active/inactive for rotation |
| 6 | 🖱️ Banner Clicks | `/admin/banner-clicks` | Pink | Banner click analytics |
| 7 | 🎨 Logo Management | `/admin/logo-management` | Blue | Select active site logo |
| 8 | 🚂 Release Train | `/admin/release-train` | Blue | Build release pipeline from commands |
| 9 | 📋 Tasks | `/admin/tasks` | Gray | Project task management |
| 10 | ⚙️ Ops | `/admin/ops/` | Gray | Operations console |
| 11 | 📈 Reports | `/admin/report/` | Gray | Analytics reports |

## Features per Admin Page

### /admin/emails
- Table: all submissions with category filter (contact/suggest)
- Filter: read/unread
- Stats: total, unread, actioned
- Edit modal: all fields editable (comment, read, actioned)
- Delete with confirmation

### /admin/clicks
- Table: last 50-200 clicks with all metadata
- Filter: by UI element
- Stats: total, unique elements, latest
- Sound toggle (bell-gong.wav on new click)
- Auto-refresh every 1 second
- Skips admin page clicks

### /admin/telemetry
- Live endpoint health check (all APIs + pages)
- Summary: healthy/issues, avg response time, last check time
- Auto-refresh every 5 seconds (toggleable)
- History table (last 50 stored checks from DB)
- Color-coded status + response time warnings (>500ms = amber)

### /admin/environments
- 3 tiles: Dev (blue), Staging (amber), Live (green)
- Each shows: site URL, admin URL, DB name/ID, deploy command
- Live status indicator (auto-checks via API)

### /admin/banner-management
- 10 banner cards with toggle switches
- Rotation pool summary (active count)
- Toast notification on toggle
- Error with auto-revert on failure
- SEO keyword badge per banner (from DB description)

### /admin/banner-clicks
- Click event table
- Stats: total, unique banners, latest
- Randomize banner_id button

### /admin/logo-management
- 5 logo options with "Set Active" button
- Current active indicator
- Confirmation on change

### /admin/release-train
- Left panel: available steering commands
- Right panel: assembled pipeline (ordered)
- Move up/down, transfer between panels
- Copy to clipboard

### /admin/tasks
- Task list with status, category, estimate
- CRUD operations

## Standard Admin Nav Links

```html
<a href="/admin">Admin</a>
<a href="/admin/emails">Emails</a>
<a href="/admin/clicks">Clicks</a>
<a href="/admin/telemetry">Telemetry</a>
<a href="/admin/environments">Environments</a>
<a href="/admin/banner-management">Banner</a>
<a href="/">← Site</a>
```

## Authentication
- Google OAuth via middleware.ts
- Allowed: raj007@gmail.com, xconvert24@gmail.com
- Session: `swf_admin_session` cookie (7 day expiry)
- Redirect to /api/auth/login if not authenticated

## Admin pages MUST have
- `<meta name="robots" content="noindex, nofollow">`
- `showHeader={false}` prop (uses own nav, not shared header)
- Own nav bar with active link highlighted
