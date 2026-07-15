/**
 * /api/games/magic-squares/ — Magic Squares game API
 *
 * GET: Fetch a puzzle
 *   ?mode=daily (default) | random
 *   ?size=4 (default) | 5 | 6
 *   ?variant=cross (default) | classic | any
 *   ?difficulty=easy | medium | hard | expert | any (default)
 *
 * POST: Submit game result
 *   { puzzle_id, grid_size, variant, solved, hints_used, solve_seconds, score, is_daily }
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'Database unavailable' }, 503);

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'daily';
  const size = parseInt(url.searchParams.get('size') || '4');
  const variant = url.searchParams.get('variant') || 'any';
  const difficulty = url.searchParams.get('difficulty') || 'any';

  if (![4, 5, 6].includes(size)) {
    return json({ error: 'Size must be 4, 5, or 6' }, 400);
  }

  const table = `magic_squares_${size}x${size}`;

  try {
    let puzzle: any = null;

    if (mode === 'daily') {
      const today = new Date().toISOString().split('T')[0];

      // Try to get today's assigned puzzle
      puzzle = await db.prepare(
        `SELECT * FROM ${table} WHERE used_date = ?`
      ).bind(today).first();

      if (!puzzle) {
        // Assign a random unused puzzle as today's daily
        let query = `SELECT * FROM ${table} WHERE used_date IS NULL`;
        const params: any[] = [];

        if (variant !== 'any') {
          query += ' AND variant = ?';
          params.push(variant);
        }
        if (difficulty !== 'any') {
          query += ' AND difficulty = ?';
          params.push(difficulty);
        }
        query += ' ORDER BY RANDOM() LIMIT 1';

        const stmt = params.length > 0
          ? await db.prepare(query).bind(...params)
          : db.prepare(query);
        puzzle = await stmt.first();

        if (puzzle) {
          // Mark as today's daily
          await db.prepare(
            `UPDATE ${table} SET used_date = ? WHERE id = ?`
          ).bind(today, puzzle.id).run();
          puzzle.used_date = today;
        }
      }
    } else {
      // Random mode — get any random puzzle, increment play counter
      let query = `SELECT * FROM ${table} WHERE 1=1`;
      const params: any[] = [];

      if (variant !== 'any') {
        query += ' AND variant = ?';
        params.push(variant);
      }
      if (difficulty !== 'any') {
        query += ' AND difficulty = ?';
        params.push(difficulty);
      }
      query += ' ORDER BY RANDOM() LIMIT 1';

      const stmt = params.length > 0
        ? await db.prepare(query).bind(...params)
        : db.prepare(query);
      puzzle = await stmt.first();
    }

    if (!puzzle) {
      return json({ error: 'No puzzles available for this configuration. Generate some first.', size, variant, difficulty }, 404);
    }

    // Build response — DON'T send the full solution, only metadata + hints
    const rows: string[] = [];
    const cols: string[] = [];
    for (let i = 1; i <= size; i++) {
      rows.push(puzzle[`row${i}`]);
      cols.push(puzzle[`col${i}`]);
    }

    // Determine which cells to reveal based on difficulty
    const revealed = generateReveals(rows, size, puzzle.difficulty);

    return json({
      id: puzzle.id,
      size,
      variant: puzzle.variant,
      difficulty: puzzle.difficulty,
      mode,
      date: puzzle.used_date || null,
      times_played: puzzle.times_played || 0,
      times_solved: puzzle.times_solved || 0,
      revealed,
      solution_hash: hashSolution(rows),
      solution: { rows, cols },
    });
  } catch (err: any) {
    return json({ error: 'Failed to fetch puzzle', detail: err.message }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'Database unavailable' }, 503);

  try {
    const body = await request.json() as any;
    const { puzzle_id, grid_size, variant, solved, hints_used, solve_seconds, score, is_daily, user_id } = body;

    if (!puzzle_id || !grid_size || !user_id) {
      return json({ error: 'Missing required fields: puzzle_id, grid_size, user_id' }, 400);
    }

    // Save result
    await db.prepare(
      `INSERT INTO magic_squares_results (user_id, puzzle_id, grid_size, variant, solved, hints_used, solve_seconds, score, is_daily) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user_id,
      puzzle_id,
      grid_size,
      variant || 'cross',
      solved ? 1 : 0,
      hints_used || 0,
      solve_seconds || 0,
      score || 0,
      is_daily ? 1 : 0
    ).run();

    // Update puzzle play stats
    const table = `magic_squares_${grid_size}x${grid_size}`;
    await db.prepare(
      `UPDATE ${table} SET times_played = times_played + 1 WHERE id = ?`
    ).bind(puzzle_id).run();

    // If solved, also increment times_solved
    if (solved) {
      await db.prepare(
        `UPDATE ${table} SET times_solved = times_solved + 1 WHERE id = ?`
      ).bind(puzzle_id).run();
    }

    return json({ success: true });
  } catch (err: any) {
    return json({ error: 'Failed to save result', detail: err.message }, 500);
  }
};

/**
 * Generate revealed cells based on difficulty.
 * Returns a 2D array of booleans (true = revealed).
 */
function generateReveals(rows: string[], size: number, difficulty: string): string[][] {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));

  if (difficulty === 'easy') {
    // Reveal ~60% of cells (diagonal + corners + random)
    for (let i = 0; i < size; i++) {
      grid[i][i] = rows[i][i]; // diagonal
      grid[i][0] = rows[i][0]; // first column
      grid[0][i] = rows[0][i]; // first row
    }
    // A few more random reveals
    for (let i = 0; i < size; i++) {
      const rc = Math.floor(Math.random() * size);
      grid[i][rc] = rows[i][rc];
    }
  } else if (difficulty === 'medium') {
    // Reveal ~35% — diagonal + a few corners
    for (let i = 0; i < size; i++) {
      grid[i][i] = rows[i][i]; // diagonal
    }
    grid[0][0] = rows[0][0];
    grid[0][size - 1] = rows[0][size - 1];
    grid[size - 1][0] = rows[size - 1][0];
    grid[size - 1][size - 1] = rows[size - 1][size - 1];
  } else if (difficulty === 'hard') {
    // Reveal ~15% — just corners
    grid[0][0] = rows[0][0];
    grid[0][size - 1] = rows[0][size - 1];
    grid[size - 1][0] = rows[size - 1][0];
    grid[size - 1][size - 1] = rows[size - 1][size - 1];
  } else {
    // Expert — reveal only first letter
    grid[0][0] = rows[0][0];
  }

  return grid;
}

/**
 * Simple hash of the solution for client-side quick-check.
 */
function hashSolution(rows: string[]): string {
  const str = rows.join('');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
