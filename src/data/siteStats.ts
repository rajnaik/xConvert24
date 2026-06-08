/**
 * Central site statistics — update these when adding new converters/tools.
 * Used across homepage, about page, admin dashboard, meta descriptions, etc.
 */

// Read version from package.json (single source of truth)
import packageJson from '../../package.json';

export const VERSION = packageJson.version;

export const STATS = {
  /** Total number of converter pages (under /convert/*) */
  converters: 20,

  /** Total number of tool/utility pages (under /tools/*) */
  tools: 25,

  /** Total converters + tools combined */
  get total() { return this.converters + this.tools; },

  /** Total units indexed in the search database */
  unitsIndexed: 170,

  /** Number of categories in the sidebar */
  categories: 15,

  /** Number of blog posts */
  blogPosts: 50,

  /** Number of currencies supported */
  currencies: 17,

  /** Number of embeddable widgets */
  widgets: 6,

  /** Label for tools (utilities) */
  get toolsLabel() { return 'Utilities'; },
};
