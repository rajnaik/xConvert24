import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;

  // Get all coins with a CA (contract address)
  const { results: coins } = await db.prepare('SELECT coinid, coinname, ca, dexscreenerurl FROM coins WHERE enabled = ?').bind('yes').all();

  const results: any[] = [];

  for (const coin of coins as any[]) {
    let tokenAddress = coin.ca;

    // If no CA, try to get it from DexScreener
    if (!tokenAddress && coin.dexscreenerurl) {
      try {
        const urlParts = coin.dexscreenerurl.split('/');
        const chain = urlParts[urlParts.length - 2];
        const pairAddress = urlParts[urlParts.length - 1];
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`);
        if (dexRes.ok) {
          const dexData: any = await dexRes.json();
          const pair = dexData.pair || dexData.pairs?.[0];
          tokenAddress = pair?.baseToken?.address || '';
        }
      } catch (e) {}
    }

    if (!tokenAddress) {
      results.push({ coinid: coin.coinid, coinname: coin.coinname, safety: '❓ No CA', error: 'No contract address' });
      continue;
    }

    try {
      const rugRes = await fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`);
      if (!rugRes.ok) {
        results.push({ coinid: coin.coinid, coinname: coin.coinname, safety: '❓ API Error' });
        continue;
      }
      const rugData: any = await rugRes.json();

      let safetyIcon = '';
      const score = rugData.score || 0;
      if (rugData.rugged) {
        safetyIcon = '🚨 RUGGED';
      } else if (score <= 100) {
        safetyIcon = '🟢 Safe (' + score + ')';
      } else if (score <= 500) {
        safetyIcon = '🟡 Caution (' + score + ')';
      } else {
        safetyIcon = '🔴 Risky (' + score + ')';
      }

      // Update coin safety field
      await db.prepare('UPDATE coins SET safety = ? WHERE coinid = ?').bind(safetyIcon, coin.coinid).run();

      results.push({
        coinid: coin.coinid,
        coinname: coin.coinname,
        safety: safetyIcon,
        holders: rugData.totalHolders,
        lpProviders: rugData.totalLPProviders,
        rugged: rugData.rugged,
        risks: rugData.risks?.length || 0,
        bundles: rugData.insiderNetworks?.length || 0,
        topHolderPct: rugData.topHolders?.[0]?.pct?.toFixed(1) + '%'
      });
    } catch (e: any) {
      results.push({ coinid: coin.coinid, coinname: coin.coinname, safety: '❓ Error', error: e.message });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
