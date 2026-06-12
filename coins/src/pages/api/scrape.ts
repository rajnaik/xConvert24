import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const body = await request.json();
  const { coinid, dexscreenerurl } = body;

  if (!coinid || !dexscreenerurl) {
    return new Response(JSON.stringify({ error: 'coinid and dexscreenerurl required' }), { status: 400 });
  }

  const urlParts = dexscreenerurl.split('/');
  const chain = urlParts[urlParts.length - 2];
  const pairAddress = urlParts[urlParts.length - 1];

  if (!chain || !pairAddress) {
    return new Response(JSON.stringify({ error: 'Could not parse chain/pair from URL' }), { status: 400 });
  }

  try {
    // DexScreener API
    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`);
    if (!dexRes.ok) return new Response(JSON.stringify({ error: 'DexScreener API returned ' + dexRes.status }), { status: 502 });

    const dexData: any = await dexRes.json();
    const pair = dexData.pair || dexData.pairs?.[0];
    if (!pair) return new Response(JSON.stringify({ error: 'No pair data from DexScreener' }), { status: 404 });

    // Extract fields
    const icon_url = pair.info?.imageUrl || '';
    // Update coin icon_url
    if (icon_url) {
      await db.prepare('UPDATE coins SET icon_url = ? WHERE coinid = ?').bind(icon_url, coinid).run();
    }    const fdv = pair.fdv ? '$' + Number(pair.fdv).toLocaleString() : '';
    const liquidity = pair.liquidity?.usd ? '$' + Number(pair.liquidity.usd).toLocaleString() : '';
    const mktcap = pair.marketCap ? '$' + Number(pair.marketCap).toLocaleString() : '';
    const price_5m = pair.priceChange?.m5 != null ? pair.priceChange.m5 + '%' : '';
    const price_1h = pair.priceChange?.h1 != null ? pair.priceChange.h1 + '%' : '';
    const price_6h = pair.priceChange?.h6 != null ? pair.priceChange.h6 + '%' : '';
    const price_24h = pair.priceChange?.h24 != null ? pair.priceChange.h24 + '%' : '';

    // Buys & Sells (24h)
    const buys = pair.txns?.h24?.buys?.toString() || '';
    const sells = pair.txns?.h24?.sells?.toString() || '';
    const txns = buys && sells ? (Number(buys) + Number(sells)) + ' (' + buys + 'B/' + sells + 'S)' : '';

    // Volume
    const volume = pair.volume?.h24 ? '$' + Number(pair.volume.h24).toLocaleString() : '';
    // DexScreener doesn't split buy/sell volume in the API, estimate 50/50 split as placeholder
    const totalVol = pair.volume?.h24 || 0;
    const buyRatio = Number(buys) / (Number(buys) + Number(sells) || 1);
    const buy_vol = totalVol ? '$' + Math.round(totalVol * buyRatio).toLocaleString() : '';
    const sell_vol = totalVol ? '$' + Math.round(totalVol * (1 - buyRatio)).toLocaleString() : '';

    // RugCheck for holders + top holder
    let holders_count = '';
    let top_holder_pct = '';
    let traders = '';
    let buyers = '';
    let sellers_count = '';
    const tokenAddress = pair.baseToken?.address || '';

    if (tokenAddress && chain === 'solana') {
      try {
        const rugRes = await fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`);
        if (rugRes.ok) {
          const rugData: any = await rugRes.json();
          holders_count = rugData.totalHolders?.toString() || '';
          if (rugData.topHolders?.[0]) top_holder_pct = rugData.topHolders[0].pct?.toFixed(1) + '%';
          if (rugData.insiderNetworks?.length > 0) traders = rugData.insiderNetworks.length + ' bundle(s)';
          else traders = 'No bundles';
          // Buyers/Sellers not in API — leave empty
          buyers = '';
          sellers_count = '';
        }
      } catch (e) {}
    }

    // Save to tracker
    const result = await db.prepare(
      `INSERT INTO tracker (coinid, dexscreenerurl, fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, traders, holders, holders_count, top_holder_pct, buys, sells, buy_vol, sell_vol, buyers, sellers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(coinid, dexscreenerurl, fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, traders, holders_count, holders_count, top_holder_pct, buys, sells, buy_vol, sell_vol, buyers, sellers_count).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id,
      data: { fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, buys, sells, buy_vol, sell_vol, buyers, sellers: sellers_count, traders, holders_count, top_holder_pct, priceUsd: pair.priceUsd, pairName: pair.baseToken?.name }
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Fetch failed: ' + e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
