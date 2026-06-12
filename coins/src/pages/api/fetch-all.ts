import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;

  // Get all enabled coins with a DexScreener URL
  const { results: coins } = await db.prepare('SELECT coinid, coinname, ca, dexscreenerurl FROM coins WHERE enabled = ? AND dexscreenerurl != ?').bind('yes', '').all();

  if (!coins || coins.length === 0) {
    return new Response(JSON.stringify({ error: 'No enabled coins with DexScreener URLs' }), { status: 404 });
  }

  // Generate batch ID
  const batchId = 'batch_' + Date.now();
  const results: any[] = [];

  for (const coin of coins as any[]) {
    const urlParts = coin.dexscreenerurl.split('/');
    const chain = urlParts[urlParts.length - 2];
    const pairAddress = urlParts[urlParts.length - 1];

    try {
      // DexScreener API
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`);
      if (!dexRes.ok) { results.push({ coinid: coin.coinid, coinname: coin.coinname, status: 'failed', error: 'API ' + dexRes.status }); continue; }

      const dexData: any = await dexRes.json();
      const pair = dexData.pair || dexData.pairs?.[0];
      if (!pair) { results.push({ coinid: coin.coinid, coinname: coin.coinname, status: 'failed', error: 'No pair data' }); continue; }

      const fdv = pair.fdv ? '$' + Number(pair.fdv).toLocaleString() : '';
      const liquidity = pair.liquidity?.usd ? '$' + Number(pair.liquidity.usd).toLocaleString() : '';
      const mktcap = pair.marketCap ? '$' + Number(pair.marketCap).toLocaleString() : '';
      const price_5m = pair.priceChange?.m5 != null ? pair.priceChange.m5 + '%' : '';
      const price_1h = pair.priceChange?.h1 != null ? pair.priceChange.h1 + '%' : '';
      const price_6h = pair.priceChange?.h6 != null ? pair.priceChange.h6 + '%' : '';
      const price_24h = pair.priceChange?.h24 != null ? pair.priceChange.h24 + '%' : '';
      const buys = pair.txns?.h24?.buys?.toString() || '';
      const sells = pair.txns?.h24?.sells?.toString() || '';
      const txns = buys && sells ? (Number(buys) + Number(sells)) + ' (' + buys + 'B/' + sells + 'S)' : '';
      const volume = pair.volume?.h24 ? '$' + Number(pair.volume.h24).toLocaleString() : '';
      const totalVol = pair.volume?.h24 || 0;
      const buyRatio = Number(buys) / (Number(buys) + Number(sells) || 1);
      const buy_vol = totalVol ? '$' + Math.round(totalVol * buyRatio).toLocaleString() : '';
      const sell_vol = totalVol ? '$' + Math.round(totalVol * (1 - buyRatio)).toLocaleString() : '';

      // Update coin icon
      const icon_url = pair.info?.imageUrl || '';
      if (icon_url) {
        await db.prepare('UPDATE coins SET icon_url = ? WHERE coinid = ?').bind(icon_url, coin.coinid).run();
      }

      // RugCheck
      let holders_count = '', top_holder_pct = '', traders = '';
      const tokenAddress = pair.baseToken?.address || '';
      if (tokenAddress && chain === 'solana') {
        try {
          const rugRes = await fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`);
          if (rugRes.ok) {
            const rugData: any = await rugRes.json();
            holders_count = rugData.totalHolders?.toString() || '';
            if (rugData.topHolders?.[0]) top_holder_pct = rugData.topHolders[0].pct?.toFixed(1) + '%';
            traders = rugData.insiderNetworks?.length > 0 ? rugData.insiderNetworks.length + ' bundle(s)' : 'No bundles';
          }
        } catch (e) {}
      }

      // Insert tracker entry with batch_id
      await db.prepare(
        `INSERT INTO tracker (coinid, dexscreenerurl, fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, traders, holders, holders_count, top_holder_pct, buys, sells, buy_vol, sell_vol, batch_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(coin.coinid, coin.dexscreenerurl, fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, traders, holders_count, holders_count, top_holder_pct, buys, sells, buy_vol, sell_vol, batchId).run();

      results.push({ coinid: coin.coinid, coinname: coin.coinname, status: 'success' });

    } catch (e: any) {
      results.push({ coinid: coin.coinid, coinname: coin.coinname, status: 'failed', error: e.message });
    }
  }

  return new Response(JSON.stringify({ success: true, batchId, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
