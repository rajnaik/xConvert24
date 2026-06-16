import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;

  const { results: coins } = await db.prepare('SELECT coinid, coinname, dexscreenerurl FROM coins WHERE enabled = ? AND dexscreenerurl != ?').bind('yes', '').all();

  if (!coins || coins.length === 0) {
    return new Response(JSON.stringify({ error: 'No enabled coins' }), { status: 404 });
  }

  const results: any[] = [];

  for (const coin of coins as any[]) {
    const urlParts = (coin as any).dexscreenerurl.split('/');
    const chain = urlParts[urlParts.length - 2];
    const pairAddressRaw = urlParts[urlParts.length - 1];

    try {
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddressRaw}`);
      if (!dexRes.ok) { results.push({ coinid: (coin as any).coinid, coinname: (coin as any).coinname, status: 'error', error: 'DexScreener ' + dexRes.status }); continue; }

      const dexData: any = await dexRes.json();
      const pair = dexData.pair || dexData.pairs?.[0];
      if (!pair) { results.push({ coinid: (coin as any).coinid, coinname: (coin as any).coinname, status: 'error', error: 'No pair' }); continue; }

      const pairAddress = pair.pairAddress;

      const hourlyRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pairAddress}/ohlcv/hour?aggregate=1&limit=1000`);
      let hourlyCount = 0;

      if (hourlyRes.ok) {
        const hourlyData: any = await hourlyRes.json();
        const candles = hourlyData?.data?.attributes?.ohlcv_list || [];
        for (const c of candles) {
          await db.prepare(
            'INSERT OR IGNORE INTO price_history (coinid, timestamp, open, high, low, close, volume, interval) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind((coin as any).coinid, c[0], c[1], c[2], c[3], c[4], c[5], 'hour').run();
        }
        hourlyCount = candles.length;
      }

      const dailyRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pairAddress}/ohlcv/day?aggregate=1&limit=1000`);
      let dailyCount = 0;

      if (dailyRes.ok) {
        const dailyData: any = await dailyRes.json();
        const candles = dailyData?.data?.attributes?.ohlcv_list || [];
        for (const c of candles) {
          await db.prepare(
            'INSERT OR IGNORE INTO price_history (coinid, timestamp, open, high, low, close, volume, interval) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind((coin as any).coinid, c[0], c[1], c[2], c[3], c[4], c[5], 'day').run();
        }
        dailyCount = candles.length;
      }

      results.push({
        coinid: (coin as any).coinid,
        coinname: (coin as any).coinname,
        hourlyCandles: hourlyCount,
        dailyCandles: dailyCount,
        status: 'success'
      });

    } catch (e: any) {
      results.push({ coinid: (coin as any).coinid, coinname: (coin as any).coinname, status: 'error', error: e.message });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const coinid = url.searchParams.get('coinid');
  const interval = url.searchParams.get('interval') || 'hour';
  const limit = url.searchParams.get('limit') || '500';

  if (!coinid) {
    return new Response(JSON.stringify({ error: 'coinid required' }), { status: 400 });
  }

  const { results } = await db.prepare(
    'SELECT timestamp, open, high, low, close, volume FROM price_history WHERE coinid = ? AND interval = ? ORDER BY timestamp ASC LIMIT ?'
  ).bind(Number(coinid), interval, Number(limit)).all();

  return new Response(JSON.stringify({ coinid: Number(coinid), interval, candles: results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
