import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const body = await request.json();
  const { coinname } = body;

  if (!coinname) {
    return new Response(JSON.stringify({ error: 'coinname required' }), { status: 400 });
  }

  try {
    // Search DexScreener by token name
    const searchRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(coinname)}`);
    if (!searchRes.ok) {
      return new Response(JSON.stringify({ error: 'DexScreener search failed: ' + searchRes.status }), { status: 502 });
    }

    const searchData: any = await searchRes.json();
    const pairs = searchData.pairs || [];

    if (pairs.length === 0) {
      return new Response(JSON.stringify({ error: 'No pairs found for "' + coinname + '"' }), { status: 404 });
    }

    // Pick the best match — highest liquidity on Solana, or first result
    const solanaPairs = pairs.filter((p: any) => p.chainId === 'solana');
    const bestPair = solanaPairs.length > 0
      ? solanaPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
      : pairs[0];

    // Build autofill data
    const result = {
      coinname: bestPair.baseToken?.name || coinname,
      icon_url: bestPair.info?.imageUrl || "",      ca: bestPair.baseToken?.address || '',
      dexscreenerurl: bestPair.url || `https://dexscreener.com/${bestPair.chainId}/${bestPair.pairAddress}`,
      narrative: '',
      currentstatus: bestPair.priceChange?.h24 > 0 ? 'Pumping' : bestPair.priceChange?.h24 < -10 ? 'Dumping' : 'Consolidating',
      trend: bestPair.priceChange?.h24 > 5 ? 'pumping' : bestPair.priceChange?.h24 < -5 ? 'dumping' : 'consolidating',
      extra: {
        icon_url: bestPair.info?.imageUrl || "", symbol: bestPair.baseToken?.symbol || '',
        priceUsd: bestPair.priceUsd || '',
        fdv: bestPair.fdv ? '$' + Number(bestPair.fdv).toLocaleString() : '',
        liquidity: bestPair.liquidity?.usd ? '$' + Number(bestPair.liquidity.usd).toLocaleString() : '',
        chain: bestPair.chainId,
        dex: bestPair.dexId,
        pairAddress: bestPair.pairAddress,
        h24Change: bestPair.priceChange?.h24 != null ? bestPair.priceChange.h24 + '%' : '',
        totalResults: pairs.length
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
