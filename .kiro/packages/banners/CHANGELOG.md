# Banner Package — Changelog & Pending Changes

Track all changes that need to be applied to the package before running `pushFeature`.

## Pending Changes (not yet applied to package files)

### 1. Theme Variables — UI Element Colors (PENDING)

**Problem:** The admin UI hardcodes color classes (`text-blue-400`, `border-purple-800`, `bg-green-500`, etc.) which will clash with destination workspace themes.

**Solution:** Extract all theme colors into CSS custom properties (variables) at the top of the admin page. After deployment, update these variables to match the destination workspace's palette.

**Variables to extract:**

```css
:root {
  /* Brand accent — nav highlights, active links */
  --banner-accent: theme('colors.blue.400');        /* SWF: blue-400, xConvert: amber-400 */
  --banner-accent-hover: theme('colors.blue.500');

  /* Summary card — rotation pool border/bg */
  --banner-summary-border: theme('colors.purple.800');
  --banner-summary-bg: theme('colors.purple.950/30');
  --banner-summary-text: theme('colors.purple.300');
  --banner-summary-dot: theme('colors.purple.600');

  /* Toggle active state */
  --banner-toggle-active: theme('colors.green.500');
  --banner-toggle-label-active: theme('colors.green.400');

  /* Card active border */
  --banner-card-active-border: theme('colors.green.600');
  --banner-card-active-ring: theme('colors.green.500/20');

  /* Toast */
  --banner-toast-border: theme('colors.green.800');
  --banner-toast-bg: theme('colors.green.950/90');
  --banner-toast-text: theme('colors.green.300');

  /* Error */
  --banner-error-border: theme('colors.red.800');
  --banner-error-bg: theme('colors.red.950/30');
  --banner-error-text: theme('colors.red.300');

  /* Warning (0 active fallback) */
  --banner-warning-text: theme('colors.amber.400');
}
```

**Affected files:**
- `admin-banner-management.astro` — all hardcoded Tailwind color classes
- `consumer-script.ts` — no color changes needed (logic only)

**Workspace theme mapping:**

| Variable | SWF | xConvert24 |
|----------|-----|-----------|
| `--banner-accent` | `blue-400` | `amber-400` |
| `--banner-summary-border` | `purple-800` | `amber-800` |
| `--banner-summary-bg` | `purple-950/30` | `amber-950/30` |
| `--banner-summary-text` | `purple-300` | `amber-300` |
| `--banner-summary-dot` | `purple-600` | `amber-600` |

---

### 2. Layout Component Import Path (PENDING)

**Problem:** `import Layout from '../../layouts/Layout.astro'` may differ per workspace.

**Solution:** Mark as `// CUSTOMIZE: Layout import path` and resolve during deployment based on destination's file structure.

---

### 3. Nav Structure (PENDING)

**Problem:** Each workspace has different admin nav links and brand logo markup.

**Solution:** After deployment, read the destination workspace's existing admin pages and replace the `<nav>` block entirely to match.

---

## Applied Changes

_(none yet — all above are pending)_

---

## How to Use This File

1. Before running `pushFeature`, review all "PENDING" items above
2. Apply each change to the package files
3. Move the item from "Pending" to "Applied" with the date
4. Then run `pushFeature <src> <dest> banners`

