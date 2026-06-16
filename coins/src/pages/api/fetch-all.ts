import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;

  // Get all enabled coins with a contract address or DexScreener URL
  const { results: coins } = await db.prepare('SELECT coinid, coinname, ca, dexscreenerurl FROM coins WHERE enabled = ? AND (ca != ? OR dexscreenerurl != ?)').bind('yes', '', '').all();

  if (!coins || coins.length === 0) {
    return new Response(JSON.stringify({ error: 'No enabled coins with CA or DexScreener URLs' }), { status: 404 });
  }

  // Generate batch ID
  const batchId = 'batch_' + Date.now();
  const results: any[] = [];

  for (const coin of coins as any[]) {
    try {
      let pair: any = null;

      // Prefer contract address lookup over URL parsing
      if (coin.ca) {
        const dexRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${coin.ca}`);
        if (dexRes.ok) {
          const dexData: any = await dexRes.json();
          // Returns array of pairs — pick highest liquidity
          const pairs = Array.isArray(dexData) ? dexData : dexData.pairs || [];
          if (pairs.length > 0) {
            pair = pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
          }
        }
      }

      // Fallback to URL-based lookup if CA didn't work
      if (!pair && coin.dexscreenerurl) {
        const urlParts = coin.dexscreenerurl.split('/');
        const chain = urlParts[urlParts.length - 2];
        const pairAddress = urlParts[urlParts.length - 1];
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`);
        if (dexRes.ok) {
          const dexData: any = await dexRes.json();
          pair = dexData.pair || dexData.pairs?.[0];
        }
      }

      if (!pair) { results.push({ coinid: coin.coinid, coinname: coin.coinname, status: 'failed', error: 'No pair data' }); continue; }

      const priceUsd = pair.priceUsd || '';
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

      // Update coin icon, pair creation date, and socials
      const icon_url = pair.info?.imageUrl || '';
      const pairCreatedAt = pair.pairCreatedAt || 0;
      // Extract socials — check multiple possible field locations
      const infoSocials = pair.info?.socials || [];
      const infoWebsites = pair.info?.websites || [];
      let twitterHandle = infoSocials.find((s: any) => s.platform === 'twitter' || s.type === 'twitter')?.handle || infoSocials.find((s: any) => s.platform === 'twitter' || s.type === 'twitter')?.url || '';
      let telegramHandle = infoSocials.find((s: any) => s.platform === 'telegram' || s.type === 'telegram')?.handle || infoSocials.find((s: any) => s.platform === 'telegram' || s.type === 'telegram')?.url || '';
      let discordHandle = infoSocials.find((s: any) => s.platform === 'discord' || s.type === 'discord')?.handle || infoSocials.find((s: any) => s.platform === 'discord' || s.type === 'discord')?.url || '';
      // Also check websites for twitter/telegram URLs
      const websiteUrls = infoWebsites.map((w: any) => w.url || w).filter(Boolean);
      if (!twitterHandle) {
        const twUrl = websiteUrls.find((u: string) => u.includes('twitter.com') || u.includes('x.com'));
        if (twUrl) twitterHandle = twUrl;
      }
      if (!telegramHandle) {
        const tgUrl = websiteUrls.find((u: string) => u.includes('t.me'));
        if (tgUrl) telegramHandle = tgUrl;
      }
      const socials = JSON.stringify({
        websites: websiteUrls.filter((u: string) => !u.includes('twitter.com') && !u.includes('x.com') && !u.includes('t.me') && !u.includes('discord')),
        twitter: twitterHandle,
        telegram: telegramHandle,
        discord: discordHandle,
      });
      await db.prepare('UPDATE coins SET icon_url = CASE WHEN ? != \'\' THEN ? ELSE icon_url END, pair_created_at = CASE WHEN ? > 0 THEN ? ELSE pair_created_at END, socials = CASE WHEN ? != \'\' THEN ? ELSE socials END WHERE coinid = ?').bind(icon_url, icon_url, pairCreatedAt, pairCreatedAt, socials, socials, coin.coinid).run();

      // RugCheck
      let holders_count = '', top_holder_pct = '', traders = '';
      let safetyScore = '';
      let rugcheckJson = '';
      const tokenAddress = pair.baseToken?.address || coin.ca || '';
      if (tokenAddress) {
        try {
          const rugRes = await fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`);
          if (rugRes.ok) {
            const rugData: any = await rugRes.json();
            holders_count = rugData.totalHolders?.toString() || '';
            if (rugData.topHolders?.[0]) top_holder_pct = rugData.topHolders[0].pct?.toFixed(1) + '%';
            traders = rugData.insiderNetworks?.length > 0 ? rugData.insiderNetworks.length + ' bundle(s)' : 'No bundles';
            // Safety score
            const score = rugData.score || 0;
            if (rugData.rugged) safetyScore = '🚨 RUGGED';
            else if (score <= 100) safetyScore = '🟢 Safe (' + score + ')';
            else if (score <= 500) safetyScore = '🟡 Caution (' + score + ')';
            else safetyScore = '🔴 Risky (' + score + ')';
            // Store detailed rugcheck data
            rugcheckJson = JSON.stringify({
              score: rugData.score,
              rugged: rugData.rugged,
              totalHolders: rugData.totalHolders,
              totalLPProviders: rugData.totalLPProviders,
              topHolders: (rugData.topHolders || []).slice(0, 5).map((h: any) => ({ address: h.address, pct: h.pct?.toFixed(2) })),
              risks: (rugData.risks || []).map((r: any) => ({ name: r.name, description: r.description, level: r.level, score: r.score })),
              insiderNetworks: rugData.insiderNetworks?.length || 0,
              markets: (rugData.markets || []).slice(0, 3).map((m: any) => ({ lp: { lpLockedPct: m.lp?.lpLockedPct } })),
            });
          }
        } catch (e) {}
      }

      // Update coin safety and rugcheck data
      if (safetyScore) {
        await db.prepare('UPDATE coins SET safety = ?, rugcheck_data = ? WHERE coinid = ?').bind(safetyScore, rugcheckJson, coin.coinid).run();
      }

      // Insert tracker entry with batch_id
      await db.prepare(
        `INSERT INTO tracker (coinid, dexscreenerurl, fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, traders, holders, holders_count, top_holder_pct, buys, sells, buy_vol, sell_vol, batch_id, price_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(coin.coinid, coin.dexscreenerurl || '', fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, traders, holders_count, holders_count, top_holder_pct, buys, sells, buy_vol, sell_vol, batchId, priceUsd).run();

      results.push({ coinid: coin.coinid, coinname: coin.coinname, status: 'success' });

    } catch (e: any) {
      results.push({ coinid: coin.coinid, coinname: coin.coinname, status: 'failed', error: e.message });
    }
  }

  return new Response(JSON.stringify({ success: true, batchId, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
