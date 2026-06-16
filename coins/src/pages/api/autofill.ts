import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { coinname, ca, coinid } = body;

  if (!coinname && !ca) {
    return new Response(JSON.stringify({ error: 'coinname or ca required' }), { status: 400 });
  }

  try {
    let bestPair: any = null;
    let totalResults = 0;

    if (ca) {
      // Fetch by contract address
      const tokenRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${ca}`);
      if (tokenRes.ok) {
        const pairs = await tokenRes.json();
        if (Array.isArray(pairs) && pairs.length > 0) {
          bestPair = pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
          totalResults = pairs.length;
        }
      }
    } else {
      // Search by name
      const searchRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(coinname)}`);
      if (searchRes.ok) {
        const searchData: any = await searchRes.json();
        const pairs = searchData.pairs || [];
        totalResults = pairs.length;
        if (pairs.length > 0) {
          const solanaPairs = pairs.filter((p: any) => p.chainId === 'solana');
          bestPair = solanaPairs.length > 0
            ? solanaPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
            : pairs[0];
        }
      }
    }

    if (!bestPair) {
      return new Response(JSON.stringify({ error: 'No pairs found' }), { status: 404 });
    }

    // RugCheck
    let safety = '';
    let rugData: any = null;
    const tokenAddress = bestPair.baseToken?.address || ca || '';
    if (tokenAddress) {
      try {
        const rugRes = await fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`);
        if (rugRes.ok) {
          rugData = await rugRes.json();
          const score = rugData.score || 0;
          if (rugData.rugged) {
            safety = '🚨 RUGGED';
          } else if (score <= 100) {
            safety = '🟢 Safe (' + score + ')';
          } else if (score <= 500) {
            safety = '🟡 Caution (' + score + ')';
          } else {
            safety = '🔴 Risky (' + score + ')';
          }
        }
      } catch (e) {}
    }

    // Update DB if coinid provided
    if (coinid && safety) {
      await db.prepare('UPDATE coins SET safety = ? WHERE coinid = ?').bind(safety, coinid).run();
    }

    const result = {
      coinname: bestPair.baseToken?.name || coinname || '',
      icon_url: bestPair.info?.imageUrl || '',
      ca: bestPair.baseToken?.address || ca || '',
      dexscreenerurl: bestPair.url || `https://dexscreener.com/${bestPair.chainId}/${bestPair.pairAddress}`,
      narrative: '',
      currentstatus: bestPair.priceChange?.h24 > 0 ? 'Pumping' : bestPair.priceChange?.h24 < -10 ? 'Dumping' : 'Consolidating',
      trend: bestPair.priceChange?.h24 > 5 ? 'pumping' : bestPair.priceChange?.h24 < -5 ? 'dumping' : 'consolidating',
      safety,
      rugcheck: rugData ? {
        score: rugData.score,
        rugged: rugData.rugged,
        holders: rugData.totalHolders,
        topHolderPct: rugData.topHolders?.[0]?.pct?.toFixed(1) + '%',
        lpProviders: rugData.totalLPProviders,
        bundles: rugData.insiderNetworks?.length || 0,
      } : null,
      extra: {
        icon_url: bestPair.info?.imageUrl || '',
        symbol: bestPair.baseToken?.symbol || '',
        priceUsd: bestPair.priceUsd || '',
        fdv: bestPair.fdv ? '$' + Number(bestPair.fdv).toLocaleString() : '',
        liquidity: bestPair.liquidity?.usd ? '$' + Number(bestPair.liquidity.usd).toLocaleString() : '',
        chain: bestPair.chainId,
        dex: bestPair.dexId,
        pairAddress: bestPair.pairAddress,
        h24Change: bestPair.priceChange?.h24 != null ? bestPair.priceChange.h24 + '%' : '',
        totalResults,
      }
    };

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Search failed: ' + e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
