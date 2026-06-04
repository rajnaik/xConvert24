/**
 * xConvert24 Embeddable Converter Widget
 * 
 * Usage: Add this to any website:
 * <div id="xconvert24-widget" data-from="kg" data-to="lb"></div>
 * <script src="https://www.xconvert24.com/embed/widget.js"></script>
 * 
 * Options (data attributes):
 *   data-from: default "from" unit (e.g. "kg", "km", "c")
 *   data-to: default "to" unit (e.g. "lb", "mi", "f")
 *   data-type: converter type - "weight", "length", "temperature" (default: weight)
 *   data-theme: "light" or "dark" (default: light)
 */
(function() {
  var container = document.getElementById('xconvert24-widget');
  if (!container) return;

  var type = container.dataset.type || 'weight';
  var fromUnit = container.dataset.from || 'kg';
  var toUnit = container.dataset.to || 'lb';
  var theme = container.dataset.theme || 'light';

  var units = {
    weight: { kg:1, g:0.001, mg:0.000001, lb:0.45359237, oz:0.028349523125, st:6.35029318, t:1000 },
    length: { km:1000, m:1, cm:0.01, mm:0.001, mi:1609.344, yd:0.9144, ft:0.3048, in:0.0254 },
    temperature: null, // special handling
  };

  function convert(val, from, to) {
    if (type === 'temperature') {
      var c;
      if (from === 'c') c = val;
      else if (from === 'f') c = (val - 32) * 5 / 9;
      else c = val - 273.15;
      if (to === 'c') return c;
      if (to === 'f') return c * 9 / 5 + 32;
      return c + 273.15;
    }
    var factors = units[type];
    if (!factors) return val;
    return val * factors[from] / factors[to];
  }

  var isDark = theme === 'dark';
  var bg = isDark ? '#1f2937' : '#ffffff';
  var border = isDark ? '#374151' : '#e5e7eb';
  var text = isDark ? '#f9fafb' : '#111827';
  var muted = isDark ? '#9ca3af' : '#6b7280';
  var accent = '#f59e0b';

  var unitOptions = Object.keys(units[type] || { c:'Celsius', f:'Fahrenheit', k:'Kelvin' });
  if (type === 'temperature') unitOptions = ['c', 'f', 'k'];

  var optionsHtml = unitOptions.map(function(u) { return '<option value="' + u + '">' + u.toUpperCase() + '</option>'; }).join('');

  container.innerHTML = '' +
    '<div style="font-family:Inter,system-ui,sans-serif;background:' + bg + ';border:1px solid ' + border + ';border-radius:12px;padding:16px;max-width:360px;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
        '<svg width="16" height="16" viewBox="0 0 280 48" fill="none"><rect x="2" y="4" width="40" height="40" rx="10" fill="' + accent + '"/><path d="M12 36L22 26M22 26V32M22 26H16" stroke="white" stroke-width="3" stroke-linecap="round"/><path d="M32 12L22 22M22 22V16M22 22H28" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>' +
        '<span style="font-size:11px;font-weight:600;color:' + muted + ';">xConvert24</span>' +
      '</div>' +
      '<div style="display:flex;gap:8px;align-items:center;">' +
        '<input id="xc-val" type="number" value="1" style="flex:1;height:36px;padding:0 10px;border:1px solid ' + border + ';border-radius:8px;font-size:14px;background:transparent;color:' + text + ';outline:none;"/>' +
        '<select id="xc-from" style="height:36px;padding:0 8px;border:1px solid ' + border + ';border-radius:8px;font-size:12px;background:transparent;color:' + text + ';">' + optionsHtml + '</select>' +
        '<span style="color:' + muted + ';font-size:14px;">→</span>' +
        '<select id="xc-to" style="height:36px;padding:0 8px;border:1px solid ' + border + ';border-radius:8px;font-size:12px;background:transparent;color:' + text + ';">' + optionsHtml + '</select>' +
      '</div>' +
      '<div id="xc-result" style="margin-top:10px;padding:10px;background:' + (isDark ? '#374151' : '#fffbeb') + ';border-radius:8px;font-size:18px;font-weight:700;color:' + accent + ';text-align:center;">—</div>' +
      '<div style="margin-top:8px;text-align:right;">' +
        '<a href="https://www.xconvert24.com" target="_blank" style="font-size:10px;color:' + muted + ';text-decoration:none;">Powered by xConvert24.com</a>' +
      '</div>' +
    '</div>';

  var valEl = document.getElementById('xc-val');
  var fromEl = document.getElementById('xc-from');
  var toEl = document.getElementById('xc-to');
  var resultEl = document.getElementById('xc-result');

  fromEl.value = fromUnit;
  toEl.value = toUnit;

  function update() {
    var v = parseFloat(valEl.value);
    if (isNaN(v)) { resultEl.textContent = '—'; return; }
    var r = convert(v, fromEl.value, toEl.value);
    resultEl.textContent = parseFloat(r.toPrecision(7)).toString() + ' ' + toEl.value.toUpperCase();
  }

  valEl.addEventListener('input', update);
  fromEl.addEventListener('change', update);
  toEl.addEventListener('change', update);
  update();
})();
