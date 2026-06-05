/**
 * Central site statistics — update these when adding new converters/tools.
 * Used across homepage, about page, admin dashboard, meta descriptions, etc.
 */

export const STATS = {
  /** Total number of converter pages (under /convert/*) */
  converters: 20,

  /** Total number of tool pages (under /tools/*) */
  tools: 14,

  /** Total converters + tools combined */
  get total() { return this.converters + this.tools; },

  /** Total units indexed in the search database */
  unitsIndexed: 165,

  /** Number of categories in the sidebar */
  categories: 10,

  /** Number of blog posts */
  blogPosts: 50,

  /** Number of currencies supported */
  currencies: 17,

  /** Number of embeddable widgets */
  widgets: 6,
};
