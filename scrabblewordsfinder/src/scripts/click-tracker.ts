/**
 * Click Tracker — sends enriched click data to /api/clicks
 * Captures: user_id, ui_element, url, session_id, screen/viewport size,
 * click coordinates, page title, device type, browser, OS
 *
 * Usage: Add data-track="element-name" to any clickable element.
 * The tracker auto-attaches via event delegation.
 */

function getSessionId(): string {
  let sid = sessionStorage.getItem('swf_session_id');
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('swf_session_id', sid);
  }
  return sid;
}

function getUserId(): string {
  let uid = localStorage.getItem('swf_user_id');
  if (!uid) {
    uid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('swf_user_id', uid);
  }
  return uid;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  return 'Other';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  return 'Other';
}

export function trackClick(uiElement: string, event?: MouseEvent): void {
  const payload = {
    user_id: getUserId(),
    ui_element: uiElement,
    url: window.location.pathname,
    session_id: getSessionId(),
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    click_x: event?.clientX ?? null,
    click_y: event?.clientY ?? null,
    page_title: document.title,
    device_type: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
  };

  fetch('/api/clicks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// Track EVERY click on the page
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const elementName = target.getAttribute('data-track')
    || target.closest('[data-track]')?.getAttribute('data-track')
    || target.closest('a')?.textContent?.trim().slice(0, 60)
    || target.closest('button')?.textContent?.trim().slice(0, 60)
    || target.tagName + (target.className ? '.' + target.className.split(' ')[0] : '');
  trackClick(elementName, e as MouseEvent);
});
