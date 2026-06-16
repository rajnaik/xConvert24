import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { url, age } = body;

  // Use selected age or default to 30 minutes
  const ageMs: Record<string, number> = { '5m': 30 * 60000, '1h': 3600000, '6h': 6 * 3600000, '24h': 24 * 3600000 };
  const cutoffMs = ageMs[age || '1h'] || 30 * 60000;
  const cutoffTime = Date.now() - cutoffMs;

  try {
    // Always fetch the latest token profiles from DexScreener
    // These are the newest tokens that have been listed
    let pairs: any[] = [];

    // Step 1: Get latest token profiles
    const profileRes = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    if (profileRes.ok) {
      const profiles: any = await profileRes.json();
      const tokens = Array.isArray(profiles) ? profiles : [];

      if (tokens.length > 0) {
        // Group by chain, fetch pair data in batches
        const chainGroups: Record<string, string[]> = {};
        for (const t of tokens) {
          if (!t.tokenAddress || !t.chainId) continue;
          if (!chainGroups[t.chainId]) chainGroups[t.chainId] = [];
          if (chainGroups[t.chainId].length < 30) chainGroups[t.chainId].push(t.tokenAddress);
        }

        for (const [chain, addresses] of Object.entries(chainGroups)) {
          const pairsRes = await fetch(`https://api.dexscreener.com/tokens/v1/${chain}/${addresses.join(',')}`);
          if (pairsRes.ok) {
            const pairsData = await pairsRes.json();
            const fetched = Array.isArray(pairsData) ? pairsData : [];
            pairs = pairs.concat(fetched);
          }
        }
      }
    }

    // Step 2: Also try latest boosted tokens for more coverage
    if (pairs.length < 20) {
      const boostRes = await fetch('https://api.dexscreener.com/token-boosts/latest/v1');
      if (boostRes.ok) {
        const boostData: any = await boostRes.json();
        const tokens = Array.isArray(boostData) ? boostData : [];
        if (tokens.length > 0) {
          const chainGroups: Record<string, string[]> = {};
          for (const t of tokens) {
            if (!t.tokenAddress || !t.chainId) continue;
            if (!chainGroups[t.chainId]) chainGroups[t.chainId] = [];
            if (chainGroups[t.chainId].length < 30) chainGroups[t.chainId].push(t.tokenAddress);
          }
          for (const [chain, addresses] of Object.entries(chainGroups)) {
            const pairsRes = await fetch(`https://api.dexscreener.com/tokens/v1/${chain}/${addresses.join(',')}`);
            if (pairsRes.ok) {
              const pairsData = await pairsRes.json();
              const fetched = Array.isArray(pairsData) ? pairsData : [];
              pairs = pairs.concat(fetched);
            }
          }
        }
      }
    }

    if (!pairs || pairs.length === 0) {
      return new Response(JSON.stringify({ error: 'No tokens found from DexScreener' }), { status: 404 });
    }

    // Filter: only pairs created within the selected age window
    pairs = pairs.filter((p: any) => {
      if (!p.pairCreatedAt) return true; // include if no creation date available
      return p.pairCreatedAt >= cutoffTime;
    });

    // Deduplicate by base token address
    const seen = new Set();
    pairs = pairs.filter((p: any) => {
      const key = p.baseToken?.address || p.pairAddress;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by liquidity descending and take top 20
    pairs = pairs
      .filter((p: any) => p.liquidity?.usd > 0)
      .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
      .slice(0, 20);

    if (pairs.length === 0) {
      return new Response(JSON.stringify({ error: 'No new coins found in the selected time window' }), { status: 404 });
    }

    const results = pairs.map((p: any) => {
      let createdAt = '';
      if (p.pairCreatedAt) {
        const diffMs = Date.now() - p.pairCreatedAt;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);
        if (diffMin < 60) createdAt = diffMin + 'm ago';
        else if (diffHr < 24) createdAt = diffHr + 'h ago';
        else createdAt = diffDay + 'd ago';
      }
      return {
        coinname: p.baseToken?.name || '',
        symbol: p.baseToken?.symbol || '',
        ca: p.baseToken?.address || '',
        chain: p.chainId || '',
        dex: p.dexId || '',
        dexscreenerurl: p.url || `https://dexscreener.com/${p.chainId}/${p.pairAddress}`,
        icon_url: p.info?.imageUrl || '',
        priceUsd: p.priceUsd || '',
        fdv: p.fdv ? '$' + Number(p.fdv).toLocaleString() : '',
        liquidity: p.liquidity?.usd ? '$' + Number(p.liquidity.usd).toLocaleString() : '',
        mktcap: p.marketCap ? '$' + Number(p.marketCap).toLocaleString() : '',
        volume24h: p.volume?.h24 ? '$' + Number(p.volume.h24).toLocaleString() : '',
        buys24h: p.txns?.h24?.buys || 0,
        sells24h: p.txns?.h24?.sells || 0,
        makers24h: p.txns?.h24?.buys && p.txns?.h24?.sells ? (p.txns.h24.buys + p.txns.h24.sells) : 0,
        h5m: p.priceChange?.m5 != null ? p.priceChange.m5 + '%' : '',
        h1: p.priceChange?.h1 != null ? p.priceChange.h1 + '%' : '',
        h6: p.priceChange?.h6 != null ? p.priceChange.h6 + '%' : '',
        h24Change: p.priceChange?.h24 != null ? p.priceChange.h24 + '%' : '',
        boosts: p.boosts?.active || 0,
        createdAt,
      };
    });

    return new Response(JSON.stringify({ success: true, coins: results }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Fetch failed: ' + e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
