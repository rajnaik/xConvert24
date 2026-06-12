# Telemetry — Deployment Package

Live site health monitoring. Shows endpoint response times and status.

## Files

| File | Destination |
|------|-------------|
| api-telemetry.ts | src/pages/api/telemetry.ts |
| admin-telemetry.astro | src/pages/admin/telemetry.astro |

## Customization

- Update ENDPOINTS array in api-telemetry.ts with destination's routes
- Update nav links in admin-telemetry.astro to match destination admin
- Add tile to admin dashboard index

## No database required — purely API-based health check.
