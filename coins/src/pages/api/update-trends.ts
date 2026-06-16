import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;

  let hours = 1;
  try {
    const body = await request.json();
    if (body.hours && body.hours >= 1 && body.hours <= 5) hours = body.hours;
  } catch (e) {} // No body = default 1hr

  const { results: coins } = await db.prepare('SELECT coinid, coinname, dexscreenerurl FROM coins WHERE enabled = ? AND dexscreenerurl != ?').bind('yes', '').all();

  if (!coins || coins.length === 0) {
    return new Response(JSON.stringify({ error: 'No enabled coins' }), { status: 404 });
  }

  const results: any[] = [];

  for (const coin of coins as any[]) {
    const urlParts = (coin as any).dexscreenerurl.split('/');
    const chain = urlParts[urlParts.length - 2];
    const pairAddress = urlParts[urlParts.length - 1];

    try {
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`);
      if (!dexRes.ok) { results.push({ coinid: (coin as any).coinid, coinname: (coin as any).coinname, status: 'failed' }); continue; }

      const dexData: any = await dexRes.json();
      const pair = dexData.pair || dexData.pairs?.[0];
      if (!pair) { results.push({ coinid: (coin as any).coinid, coinname: (coin as any).coinname, status: 'failed' }); continue; }

      let priceChange = 0;
      let timeLabel = '';
      if (hours <= 1) {
        priceChange = pair.priceChange?.h1 || 0;
        timeLabel = '1h';
      } else if (hours <= 3) {
        priceChange = pair.priceChange?.h6 ? pair.priceChange.h6 * (hours / 6) : pair.priceChange?.h1 * hours || 0;
        timeLabel = hours + 'h (estimated)';
      } else {
        priceChange = pair.priceChange?.h6 || 0;
        timeLabel = '6h';
      }

      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const { results: oldEntries } = await db.prepare(
        'SELECT mktcap FROM tracker WHERE coinid = ? AND tracked_at <= ? ORDER BY tracked_at DESC LIMIT 1'
      ).bind((coin as any).coinid, cutoffTime).all();

      let mktCapChange = priceChange;
      if (oldEntries && oldEntries.length > 0) {
        const oldMktCap = parseFloat(((oldEntries[0] as any).mktcap || '').replace(/[$,]/g, ''));
        const currentMktCap = pair.marketCap || 0;
        if (oldMktCap > 0 && currentMktCap > 0) {
          mktCapChange = ((currentMktCap - oldMktCap) / oldMktCap) * 100;
          timeLabel = hours + 'h (actual)';
        }
      }

      let trend = 'consolidating';
      if (mktCapChange >= 15) trend = 'pumping';
      else if (mktCapChange >= 5) trend = 'accumulating';
      else if (mktCapChange <= -15) trend = 'dumping';
      else if (mktCapChange <= -5) trend = 'distributing';

      let currentstatus = 'Consolidating';
      const h1 = pair.priceChange?.h1 || 0;
      const h24 = pair.priceChange?.h24 || 0;

      if (mktCapChange >= 20) currentstatus = 'Mooning';
      else if (mktCapChange >= 10) currentstatus = 'Pumping Hard';
      else if (mktCapChange >= 5) currentstatus = 'Pumping';
      else if (mktCapChange >= 2 && mktCapChange < 5) currentstatus = 'Creeping Up';
      else if (mktCapChange <= -20) currentstatus = 'Crashing';
      else if (mktCapChange <= -10) currentstatus = 'Dumping Hard';
      else if (mktCapChange <= -5) currentstatus = 'Dumping';
      else if (mktCapChange <= -2 && mktCapChange > -5) currentstatus = 'Bleeding';
      else if (Math.abs(mktCapChange) < 2) currentstatus = 'Consolidating';

      if (h24 >= 30 && h1 <= -5) currentstatus = 'Profit Taking';
      if (h24 <= -30 && h1 >= 5) currentstatus = 'Dead Cat Bounce';

      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      await db.prepare('UPDATE coins SET trend = ?, currentstatus = ?, datemodified = datetime(?) WHERE coinid = ?')
        .bind(trend, currentstatus, now, (coin as any).coinid).run();

      results.push({
        coinid: (coin as any).coinid,
        coinname: (coin as any).coinname,
        trend,
        currentstatus,
        mktCapChange: mktCapChange.toFixed(2) + '%',
        timeLabel,
        hours
      });

    } catch (e: any) {
      results.push({ coinid: (coin as any).coinid, coinname: (coin as any).coinname, status: 'error', error: e.message });
    }
  }

  return new Response(JSON.stringify({ success: true, hours, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
