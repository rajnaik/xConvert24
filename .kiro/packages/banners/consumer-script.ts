/**
 * Banner Rotation — Consumer Script
 * 
 * Embed this inside a <script> tag on your homepage or layout.
 * It fetches active banners from the pool and randomly picks one on each page load.
 *
 * CUSTOMIZE:
 * - Change element IDs to match your HTML (hero-banner-img, hero-banner-link)
 * - Change the click destination (window.location.href = '/') to your target page
 */

(async function loadBanner() {
  try {
    // Fetch active banners for rotation
    const res = await fetch('/api/banners?active=true');
    let opt = 1;
    let bannerId = 'banner-1';

    if (res.ok) {
      const data = await res.json();
      const activeBanners = data.banners || [];
      if (activeBanners.length > 0) {
        // Pick a random banner from the active pool
        const picked = activeBanners[Math.floor(Math.random() * activeBanners.length)];
        opt = picked.option_number;
        bannerId = `banner-${opt}`;
      }
    }

    // Update the banner image
    const img = document.getElementById('hero-banner-img') as HTMLImageElement;
    if (img) img.src = `/banner-options/banner-${opt}.svg`;

    // Make banner clickable — track click then navigate
    const bannerLink = document.getElementById('hero-banner-link') as HTMLAnchorElement;
    if (bannerLink) {
      bannerLink.dataset.bannerId = bannerId;
      bannerLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await fetch('/api/banner-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ banner_id: bannerId, page_url: window.location.pathname }),
          });
        } catch {}
        window.location.href = '/'; // ← CHANGE THIS to your target
      });
    }
  } catch {}
})();
