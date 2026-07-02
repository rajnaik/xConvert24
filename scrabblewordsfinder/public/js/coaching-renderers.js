/**
 * coaching-renderers.js — Structured coaching data renderers for /chat/
 * Renders stats bars, canvas graphs, time insights, and per-game cards
 * for Quiz, Rack, and Anagram coaching modes (CaB is inline in chat.astro).
 */

// ─── SHARED HELPERS ─────────────────────────────────────────────────────────

function coachScrollToBottom() {
  var el = document.getElementById('messages');
  if (el) el.scrollTop = el.scrollHeight;
}

function coachRatingColors(rating) {
  var map = {
    perfect: { border: 'border-purple-500/40', bg: 'bg-purple-900/10', badge: 'bg-purple-600/30 text-purple-300', icon: '\ud83c\udfc6' },
    excellent: { border: 'border-purple-500/40', bg: 'bg-purple-900/10', badge: 'bg-purple-600/30 text-purple-300', icon: '\u26a1' },
    genius: { border: 'border-purple-500/40', bg: 'bg-purple-900/10', badge: 'bg-purple-600/30 text-purple-300', icon: '\ud83e\udde0' },
    great: { border: 'border-green-500/40', bg: 'bg-green-900/10', badge: 'bg-green-600/30 text-green-300', icon: '\u2705' },
    good: { border: 'border-blue-500/40', bg: 'bg-blue-900/10', badge: 'bg-blue-600/30 text-blue-300', icon: '\ud83d\udc4d' },
    fair: { border: 'border-amber-500/40', bg: 'bg-amber-900/10', badge: 'bg-amber-600/30 text-amber-300', icon: '\ud83d\ude10' },
    close: { border: 'border-amber-500/40', bg: 'bg-amber-900/10', badge: 'bg-amber-600/30 text-amber-300', icon: '\ud83e\udd1e' },
    weak: { border: 'border-orange-500/40', bg: 'bg-orange-900/10', badge: 'bg-orange-600/30 text-orange-300', icon: '\ud83d\ude24' },
    failed: { border: 'border-red-500/40', bg: 'bg-red-900/10', badge: 'bg-red-600/30 text-red-300', icon: '\u274c' }
  };
  return map[rating] || map.good;
}

function renderPerGameCards(games, display, ratingFn) {
  var cardsHtml = '<div class="mt-2"><div class="flex items-center justify-between mb-2"><p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Per-Game Analysis</p><span class="text-[10px] text-gray-600">' + display.length + ' of ' + games.length + ' games</span></div><div class="flex flex-col gap-2 max-h-64 overflow-y-auto">';
  for (var i = 0; i < display.length; i++) {
    var g = display[i];
    var colors = coachRatingColors(g.rating);
    var dateStr = g.date && g.date !== '?' ? new Date(g.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '\u2014';
    var detailHtml = ratingFn(g);
    cardsHtml += '<div class="rounded-xl ' + colors.border + ' ' + colors.bg + ' border p-3">';
    cardsHtml += '<div class="flex items-center justify-between mb-1"><div class="flex items-center gap-2"><span class="text-base">' + colors.icon + '</span><span class="text-xs font-bold text-white">Game #' + g.gameNumber + '</span><span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ' + colors.badge + '">' + g.rating.toUpperCase() + '</span></div><span class="text-[10px] text-gray-500">' + dateStr + '</span></div>';
    cardsHtml += detailHtml;
    if (g.improvements && g.improvements.length > 0) {
      cardsHtml += '<div class="mt-1.5">';
      for (var s = 0; s < g.improvements.length; s++) cardsHtml += '<p class="text-[11px] text-green-300/80 pl-2 border-l-2 border-green-500/30 mb-0.5">' + g.improvements[s] + '</p>';
      cardsHtml += '</div>';
    }
    if (g.weaknesses && g.weaknesses.length > 0) {
      cardsHtml += '<div class="mt-1.5">';
      for (var w = 0; w < g.weaknesses.length; w++) cardsHtml += '<p class="text-[11px] text-red-300/80 pl-2 border-l-2 border-red-500/30 mb-0.5">' + g.weaknesses[w] + '</p>';
      cardsHtml += '</div>';
    }
    cardsHtml += '</div>';
  }
  cardsHtml += '</div></div>';
  return cardsHtml;
}

function renderLineGraph(canvasId, dataPoints, options) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var w = canvas.clientWidth;
  var h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  var pad = { top: 16, right: 12, bottom: 28, left: 30 };
  var plotW = w - pad.left - pad.right;
  var plotH = h - pad.top - pad.bottom;
  var n = dataPoints.length;
  var values = dataPoints.map(function(d) { return d.value; });
  var maxVal = options.maxVal || (Math.max.apply(null, values) + 1);
  var avg = values.length > 0 ? values.reduce(function(a, b) { return a + b; }, 0) / values.length : 0;

  ctx.clearRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (var i = 0; i <= 5; i++) {
    var y = pad.top + (plotH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
  }

  // Y-axis labels
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = options.labelColor || 'rgba(74,222,128,0.7)';
  for (var i = 0; i <= 5; i++) {
    var val = Math.round((maxVal / 5) * (5 - i));
    var y = pad.top + (plotH / 5) * i;
    ctx.fillText(val === 0 ? '' : String(val), pad.left - 6, y + 3);
  }

  // X-axis labels
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  var labelStep = Math.max(1, Math.floor(n / 8));
  for (var i = 0; i < n; i += labelStep) {
    var x = pad.left + (plotW / Math.max(n - 1, 1)) * i;
    ctx.fillText(dataPoints[i].label || '#' + (i + 1), x, h - pad.bottom + 14);
  }

  // Average line (dashed)
  if (avg > 0) {
    var avgY = pad.top + plotH - (avg / maxVal) * plotH;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, avgY); ctx.lineTo(w - pad.right, avgY); ctx.stroke();
    ctx.setLineDash([]);
  }

  function getXY(index, value) {
    var x = pad.left + (plotW / Math.max(n - 1, 1)) * index;
    var y = pad.top + plotH - (value / maxVal) * plotH;
    return { x: x, y: y };
  }

  // Line
  ctx.strokeStyle = options.lineColor || 'rgba(251,146,60,0.6)';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (var i = 0; i < n; i++) {
    var pt = getXY(i, values[i]);
    if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();

  // Dots
  for (var i = 0; i < n; i++) {
    var pt = getXY(i, values[i]);
    ctx.fillStyle = dataPoints[i].color || options.dotColor || 'rgba(74,222,128,1)';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, dataPoints[i].highlight ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── QUIZ COACHING DATA ─────────────────────────────────────────────────────

function appendQuizCoachData(containerEl) {
  var uid = localStorage.getItem('swf-uid') || '';
  if (!uid) return;

  fetch('/api/lex-quiz-coach/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: uid })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.error || !data.hasHistory) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'mt-4 space-y-4';

    // Stats bar
    if (data.stats) {
      var s = data.stats;
      var statsHtml = '<div class="grid grid-cols-4 gap-2">';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-white">' + s.totalGames + '</p><p class="text-[10px] text-gray-500">Games</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-green-400">' + s.accuracy + '%</p><p class="text-[10px] text-gray-500">Accuracy</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-orange-400">' + s.avgTime + 's</p><p class="text-[10px] text-gray-500">Avg Time</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-purple-400">' + s.totalPerfect + '</p><p class="text-[10px] text-gray-500">Perfect</p></div>';
      statsHtml += '</div>';
      wrapper.insertAdjacentHTML('beforeend', statsHtml);
    }

    // Graph (accuracy per game)
    var games = data.gameAnalysis || [];
    if (games.length >= 3) {
      var graphSection = document.createElement('div');
      graphSection.className = 'mt-3';
      graphSection.innerHTML = '<p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Accuracy per Game (higher = better)</p><canvas id="chat-quiz-graph" class="w-full h-36 rounded-lg bg-gray-800/30 border border-gray-700/30"></canvas><div class="flex justify-between mt-1 text-[9px] text-gray-600"><span>\ud83d\udfe2 \u226580%</span><span>\ud83d\udfe1 50-79%</span><span>\ud83d\udd34 &lt;50%</span><span>\u2b1c Average</span></div>';
      wrapper.appendChild(graphSection);

      setTimeout(function() {
        var sorted = games.slice().sort(function(a, b) { return a.gameNumber - b.gameNumber; });
        var pts = sorted.map(function(g) {
          var color = g.accuracy >= 80 ? 'rgba(74,222,128,1)' : g.accuracy >= 50 ? 'rgba(250,204,21,1)' : 'rgba(248,113,113,1)';
          return { value: g.accuracy, label: '#' + g.gameNumber, color: color, highlight: g.accuracy === 100 };
        });
        renderLineGraph('chat-quiz-graph', pts, { maxVal: 100, lineColor: 'rgba(96,165,250,0.6)', dotColor: 'rgba(96,165,250,1)', labelColor: 'rgba(96,165,250,0.7)' });
      }, 50);
    }

    // Phase progression insight
    if (data.phases) {
      var p = data.phases;
      var trendIcon = p.trend === 'improving' ? '\ud83d\udcc8' : p.trend === 'declining' ? '\ud83d\udcc9' : '\u2796';
      var trendColor = p.trend === 'improving' ? 'text-green-400' : p.trend === 'declining' ? 'text-red-400' : 'text-gray-400';
      var phaseHtml = '<div class="px-3 py-2 rounded-lg bg-indigo-900/20 border border-indigo-700/30">';
      phaseHtml += '<p class="text-[10px] text-indigo-400 font-semibold uppercase mb-1">' + trendIcon + ' Progression Analysis</p>';
      phaseHtml += '<p class="text-[11px] text-gray-300 leading-relaxed">Beginning: ' + p.beginning.accuracy + '% \u2192 Middle: ' + p.mid.accuracy + '% \u2192 End: ' + p.end.accuracy + '% <span class="' + trendColor + ' font-semibold">(' + (p.accDelta >= 0 ? '+' : '') + p.accDelta + '% overall)</span></p>';
      phaseHtml += '</div>';
      wrapper.insertAdjacentHTML('beforeend', phaseHtml);
    }

    // Per-game cards
    if (games.length > 0) {
      var display = games.slice(0, 10);
      var html = renderPerGameCards(games, display, function(g) {
        var resultText = g.accuracy + '% (' + g.score + '/' + g.total + ')';
        var timeText = g.timeUsed > 0 ? ' \u00b7 ' + g.timeUsed + 's' : '';
        var detail = '<div class="flex items-center gap-3 text-[11px] text-gray-400"><span>' + resultText + '</span>' + (timeText ? '<span>Time: <b class="text-white">' + g.timeUsed + 's</b></span>' : '') + (g.timedOut ? '<span class="text-red-400">Timed out</span>' : '') + '</div>';
        if (g.missedWords && g.missedWords.length > 0) {
          detail += '<p class="text-[10px] text-gray-500 mt-1">Missed: <span class="text-orange-300">' + g.missedWords.slice(0, 5).join(', ') + '</span></p>';
        }
        return detail;
      });
      wrapper.insertAdjacentHTML('beforeend', html);
    }

    containerEl.appendChild(wrapper);
    coachScrollToBottom();
  })
  .catch(function() { /* Non-critical */ });
}

// ─── RACK COACHING DATA ─────────────────────────────────────────────────────

function appendRackCoachData(containerEl) {
  var uid = localStorage.getItem('swf-uid') || '';
  if (!uid) return;

  fetch('/api/lex-rack-coach/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: uid })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.error || !data.hasHistory) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'mt-4 space-y-4';

    // Stats bar
    if (data.stats) {
      var s = data.stats;
      var statsHtml = '<div class="grid grid-cols-4 gap-2">';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-white">' + s.totalWords + '</p><p class="text-[10px] text-gray-500">Words</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-green-400">' + s.avgScore + '</p><p class="text-[10px] text-gray-500">Avg Score</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-orange-400">' + s.bingos + '</p><p class="text-[10px] text-gray-500">Bingos</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-purple-400">' + (s.highWord ? s.highWord.score : 0) + '</p><p class="text-[10px] text-gray-500">Best Score</p></div>';
      statsHtml += '</div>';
      wrapper.insertAdjacentHTML('beforeend', statsHtml);
    }

    // Graph (score per game)
    var games = data.gameAnalysis || [];
    if (games.length >= 3) {
      var graphSection = document.createElement('div');
      graphSection.className = 'mt-3';
      graphSection.innerHTML = '<p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Score per Play (higher = better)</p><canvas id="chat-rack-graph" class="w-full h-36 rounded-lg bg-gray-800/30 border border-gray-700/30"></canvas><div class="flex justify-between mt-1 text-[9px] text-gray-600"><span>\ud83d\udfe2 20+ pts</span><span>\ud83d\udfe1 10-19 pts</span><span>\ud83d\udd34 &lt;10 pts</span><span>\u2b1c Average</span></div>';
      wrapper.appendChild(graphSection);

      setTimeout(function() {
        var sorted = games.slice().sort(function(a, b) { return a.gameNumber - b.gameNumber; });
        var maxScore = Math.max.apply(null, sorted.map(function(g) { return g.score; }));
        var pts = sorted.map(function(g) {
          var color = g.score >= 20 ? 'rgba(74,222,128,1)' : g.score >= 10 ? 'rgba(250,204,21,1)' : 'rgba(248,113,113,1)';
          return { value: g.score, label: '#' + g.gameNumber, color: color, highlight: g.isBingo };
        });
        renderLineGraph('chat-rack-graph', pts, { maxVal: Math.max(maxScore + 5, 30), lineColor: 'rgba(168,85,247,0.6)', dotColor: 'rgba(168,85,247,1)', labelColor: 'rgba(168,85,247,0.7)' });
      }, 50);
    }

    // Phase progression insight
    if (data.phases) {
      var p = data.phases;
      var trendIcon = p.trend === 'improving' ? '\ud83d\udcc8' : p.trend === 'declining' ? '\ud83d\udcc9' : '\u2796';
      var trendColor = p.trend === 'improving' ? 'text-green-400' : p.trend === 'declining' ? 'text-red-400' : 'text-gray-400';
      var phaseHtml = '<div class="px-3 py-2 rounded-lg bg-purple-900/20 border border-purple-700/30">';
      phaseHtml += '<p class="text-[10px] text-purple-400 font-semibold uppercase mb-1">' + trendIcon + ' Score Progression</p>';
      phaseHtml += '<p class="text-[11px] text-gray-300 leading-relaxed">Beginning: avg ' + p.beginning.avgScore + ' pts \u2192 Middle: avg ' + p.mid.avgScore + ' pts \u2192 End: avg ' + p.end.avgScore + ' pts <span class="' + trendColor + ' font-semibold">(' + (p.scoreDelta >= 0 ? '+' : '') + p.scoreDelta + ' pts)</span></p>';
      phaseHtml += '</div>';
      wrapper.insertAdjacentHTML('beforeend', phaseHtml);
    }

    // Per-game cards
    if (games.length > 0) {
      var display = games.slice(0, 10);
      var html = renderPerGameCards(games, display, function(g) {
        var detail = '<div class="flex items-center gap-3 text-[11px] text-gray-400">';
        detail += '<span class="font-mono uppercase text-amber-300">' + g.word + '</span>';
        detail += '<span><b class="text-white">' + g.score + '</b> pts</span>';
        detail += '<span>' + g.wordLength + ' letters</span>';
        if (g.isBingo) detail += '<span class="text-purple-400 font-semibold">BINGO!</span>';
        if (g.rack) detail += '<span class="text-gray-600">Rack: ' + g.rack + '</span>';
        detail += '</div>';
        return detail;
      });
      wrapper.insertAdjacentHTML('beforeend', html);
    }

    containerEl.appendChild(wrapper);
    coachScrollToBottom();
  })
  .catch(function() { /* Non-critical */ });
}

// ─── ANAGRAM COACHING DATA ──────────────────────────────────────────────────

function appendAnagramCoachData(containerEl) {
  var uid = localStorage.getItem('swf-uid') || '';
  if (!uid) return;

  fetch('/api/lex-anagram-coach/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: uid })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.error || !data.hasHistory) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'mt-4 space-y-4';

    // Stats bar
    if (data.stats) {
      var s = data.stats;
      var statsHtml = '<div class="grid grid-cols-4 gap-2">';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-white">' + s.totalGames + '</p><p class="text-[10px] text-gray-500">Puzzles</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-green-400">' + s.solveRate + '%</p><p class="text-[10px] text-gray-500">Solve Rate</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-orange-400">' + s.avgAttempts + '</p><p class="text-[10px] text-gray-500">Avg Attempts</p></div>';
      statsHtml += '<div class="text-center p-2 rounded-lg bg-gray-700/50 border border-gray-600/50"><p class="text-lg font-bold text-purple-400">' + s.streak + '</p><p class="text-[10px] text-gray-500">Streak</p></div>';
      statsHtml += '</div>';
      wrapper.insertAdjacentHTML('beforeend', statsHtml);
    }

    // Graph (attempts per puzzle — lower is better)
    var games = data.gameAnalysis || [];
    if (games.length >= 3) {
      var graphSection = document.createElement('div');
      graphSection.className = 'mt-3';
      graphSection.innerHTML = '<p class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Attempts per Puzzle (lower = better)</p><canvas id="chat-anagram-graph" class="w-full h-36 rounded-lg bg-gray-800/30 border border-gray-700/30"></canvas><div class="flex justify-between mt-1 text-[9px] text-gray-600"><span>\ud83d\udfe2 Solved</span><span>\ud83d\udd34 Failed</span><span>\u2b1c Average</span></div>';
      wrapper.appendChild(graphSection);

      setTimeout(function() {
        var sorted = games.slice().sort(function(a, b) { return a.gameNumber - b.gameNumber; });
        var pts = sorted.map(function(g) {
          var val = g.solved ? g.attempts : 6;
          var color = g.solved ? 'rgba(74,222,128,1)' : 'rgba(248,113,113,1)';
          return { value: val, label: '#' + g.gameNumber, color: color, highlight: g.attempts === 1 && g.solved };
        });
        renderLineGraph('chat-anagram-graph', pts, { maxVal: 7, lineColor: 'rgba(251,146,60,0.6)', dotColor: 'rgba(251,146,60,1)', labelColor: 'rgba(251,146,60,0.7)' });
      }, 50);
    }

    // Phase progression insight
    if (data.phases) {
      var p = data.phases;
      var trendIcon = p.trend === 'improving' ? '\ud83d\udcc8' : p.trend === 'declining' ? '\ud83d\udcc9' : '\u2796';
      var trendColor = p.trend === 'improving' ? 'text-green-400' : p.trend === 'declining' ? 'text-red-400' : 'text-gray-400';
      var phaseHtml = '<div class="px-3 py-2 rounded-lg bg-orange-900/20 border border-orange-700/30">';
      phaseHtml += '<p class="text-[10px] text-orange-400 font-semibold uppercase mb-1">' + trendIcon + ' Solve Progression</p>';
      phaseHtml += '<p class="text-[11px] text-gray-300 leading-relaxed">Beginning: ' + p.beginning.solveRate + '% solve, avg ' + p.beginning.avgAttempts + ' attempts \u2192 End: ' + p.end.solveRate + '% solve, avg ' + p.end.avgAttempts + ' attempts <span class="' + trendColor + ' font-semibold">(' + (p.rateDelta >= 0 ? '+' : '') + p.rateDelta + '% rate)</span></p>';
      phaseHtml += '</div>';
      wrapper.insertAdjacentHTML('beforeend', phaseHtml);
    }

    // Time commentary
    var timedGames = games.filter(function(g) { return g.timeTaken > 0; });
    if (timedGames.length >= 2) {
      var times = timedGames.map(function(g) { return g.timeTaken; });
      var fastest = Math.min.apply(null, times);
      var slowest = Math.max.apply(null, times);
      var avg = Math.round(times.reduce(function(a, b) { return a + b; }, 0) / times.length);
      var timeHtml = '<div class="px-3 py-2 rounded-lg bg-cyan-900/20 border border-cyan-700/30">';
      timeHtml += '<p class="text-[10px] text-cyan-400 font-semibold uppercase mb-1">\u23f1 Time Insight</p>';
      timeHtml += '<p class="text-[11px] text-gray-300 leading-relaxed">Fastest: ' + fastest + 's \u00b7 Slowest: ' + slowest + 's \u00b7 Avg: ' + avg + 's</p>';
      timeHtml += '</div>';
      wrapper.insertAdjacentHTML('beforeend', timeHtml);
    }

    // Per-game cards
    if (games.length > 0) {
      var display = games.slice(0, 10);
      var html = renderPerGameCards(games, display, function(g) {
        var resultText = g.solved ? 'Solved in ' + g.attempts + ' attempt' + (g.attempts === 1 ? '' : 's') : 'Not solved';
        var timeText = g.timeTaken > 0 ? ' \u00b7 ' + g.timeTaken + 's' : '';
        var detail = '<div class="flex items-center gap-3 text-[11px] text-gray-400"><span>' + resultText + '</span>' + (timeText ? '<span>Time: <b class="text-white">' + g.timeTaken + 's</b></span>' : '') + (g.word ? '<span class="font-mono uppercase text-orange-300">' + g.word + '</span>' : '') + (g.wordLength ? '<span class="text-gray-600">' + g.wordLength + ' letters</span>' : '') + '</div>';
        return detail;
      });
      wrapper.insertAdjacentHTML('beforeend', html);
    }

    containerEl.appendChild(wrapper);
    coachScrollToBottom();
  })
  .catch(function() { /* Non-critical */ });
}
