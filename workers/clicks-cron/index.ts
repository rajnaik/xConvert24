/**
 * xConvert24 Clicks Cron Worker
 * 
 * Runs every 15 minutes via Cloudflare Cron Trigger.
 * Pings the main app's refresh-clicks-analysis endpoint to keep
 * the ClicksAnalysis table up to date with aggregated click data.
 */

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const url = 'https://www.xconvert24.com/api/cron/refresh-clicks-analysis';

    try {
      const response = await fetch(url);
      const data = await response.json() as Record<string, unknown>;
      console.log(`[clicks-cron] ${new Date().toISOString()} — OK:`, JSON.stringify(data));
    } catch (err) {
      console.error(`[clicks-cron] ${new Date().toISOString()} — FAILED:`, err);
    }
  },

  // Also respond to HTTP for manual testing
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = 'https://www.xconvert24.com/api/cron/refresh-clicks-analysis';

    try {
      const response = await fetch(url);
      const data = await response.json();
      return new Response(JSON.stringify({ triggered: true, result: data }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ triggered: false, error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

interface Env {}
