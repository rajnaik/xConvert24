/**
 * coaching-pdf.js — PDF generation + localStorage manager for Lex coaching reports
 * Depends on jsPDF loaded via CDN before this script.
 * Provides: generateCoachingPDF(), saveReportToStorage(), getStoredReports(), deleteStoredReport()
 */

// ─── PDF STORAGE (Rolling 5 in localStorage) ────────────────────────────────

var PDF_STORAGE_KEY = 'swf-coaching-reports';
var MAX_STORED_REPORTS = 5;

function getStoredReports() {
  try {
    var raw = localStorage.getItem(PDF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveReportToStorage(report) {
  // report: { id, type, title, date, base64 }
  var reports = getStoredReports();
  reports.unshift(report);
  // Keep only the latest 5
  if (reports.length > MAX_STORED_REPORTS) {
    reports = reports.slice(0, MAX_STORED_REPORTS);
  }
  try {
    localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    // Storage full — try saving without base64 data as fallback
    throw new Error('Storage quota exceeded — clear browser data or delete old reports');
  }
  // Dispatch event so UI can update
  window.dispatchEvent(new CustomEvent('coaching-reports-updated'));
  return reports;
}

function deleteStoredReport(reportId) {
  var reports = getStoredReports();
  reports = reports.filter(function(r) { return r.id !== reportId; });
  localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(reports));
  window.dispatchEvent(new CustomEvent('coaching-reports-updated'));
  return reports;
}

// ─── PDF GENERATION ──────────────────────────────────────────────────────────

/**
 * Generate a branded coaching report PDF.
 * @param {Object} opts
 * @param {string} opts.type - 'quiz' | 'rack' | 'anagram' | 'cab'
 * @param {string} opts.analysis - The AI coaching text (with emoji sections)
 * @param {Object} opts.stats - Stats object from the coaching API
 * @param {Object|null} opts.phases - Phase progression data (or null)
 * @returns {Promise<{blob: Blob, base64: string, filename: string}>}
 */
async function generateCoachingPDF(opts) {
  var type = opts.type || 'quiz';
  var analysis = opts.analysis || '';
  var stats = opts.stats || {};
  var phases = opts.phases || null;

  // Type labels
  var typeLabels = {
    quiz: 'Word Quiz',
    rack: 'Daily Rack Challenge',
    anagram: 'Daily Anagram',
    cab: 'Cows & Bulls'
  };
  var typeLabel = typeLabels[type] || 'Coaching Report';

  // Create PDF (A4)
  var doc = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });
  var pageW = 210;
  var margin = 15;
  var contentW = pageW - margin * 2;
  var y = margin;

  // ── Header: Logo + Title ──
  // Try to load logo image
  try {
    var logoImg = await loadImageAsBase64('/lex-avatar-64.png');
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', margin, y, 12, 12);
    }
  } catch {}

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text('Lex Coaching Report', margin + 15, y + 5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(typeLabel + ' Performance Analysis', margin + 15, y + 10);

  y += 16;

  // Divider line
  doc.setDrawColor(34, 197, 94); // emerald-500
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ── Meta info bar ──
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  var timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Generated: ' + dateStr + ' at ' + timeStr, margin, y);
  doc.text('scrabblewordsfinder.com', pageW - margin, y, { align: 'right' });
  y += 6;

  // ── Stats Summary Box ──
  if (stats && Object.keys(stats).length > 0) {
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, contentW, 18, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('PERFORMANCE SNAPSHOT', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    var statsLine = buildStatsLine(type, stats);
    doc.setTextColor(40, 40, 40);
    doc.text(statsLine, margin + 4, y + 12, { maxWidth: contentW - 8 });
    y += 22;
  }

  // ── Phase Progression (if available) ──
  if (phases && phases.beginning && phases.mid && phases.end) {
    y += 2;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // indigo
    doc.text('PROGRESSION TREND: ' + (phases.trend || 'stable').toUpperCase(), margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    var phaseText;
    // Rack phases use avgScore (points), others use solveRate/accuracy (%)
    if (typeof phases.beginning.avgScore === 'number') {
      phaseText = 'Beginning: ' + phases.beginning.avgScore + ' pts  >  ';
      phaseText += 'Middle: ' + phases.mid.avgScore + ' pts  >  ';
      phaseText += 'End: ' + phases.end.avgScore + ' pts';
    } else {
      phaseText = 'Beginning: ' + getPhasePercent(phases.beginning) + '%  >  ';
      phaseText += 'Middle: ' + getPhasePercent(phases.mid) + '%  >  ';
      phaseText += 'End: ' + getPhasePercent(phases.end) + '%';
    }
    doc.text(phaseText, margin, y);
    y += 6;
  }

  // ── Main Analysis Content ──
  y += 2;
  var lines = analysis.split('\n');
  doc.setFontSize(9);

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) { y += 3; continue; }

    // Check for page overflow
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    // Section headers (emoji markers)
    if (isSectionHeader(line)) {
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      // Strip emoji for clean PDF rendering
      var cleanHeader = stripEmoji(line);
      doc.text(cleanHeader, margin, y);
      y += 5;
      // Subtle underline
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 1, margin + doc.getTextWidth(cleanHeader), y - 1);
      continue;
    }

    // Bullet points (✅, •, -)
    if (line.match(/^[\u2705\u2022\u2023•\-\u2013\u2014]/)) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      var bulletText = '  \u2022 ' + stripEmoji(line).replace(/^[\u2022•\-\u2013\u2014]\s*/, '');
      var wrapped = doc.splitTextToSize(bulletText, contentW - 6);
      doc.text(wrapped, margin + 3, y);
      y += wrapped.length * 4;
      continue;
    }

    // Regular text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    var cleanLine = stripEmoji(line);
    var wrappedLines = doc.splitTextToSize(cleanLine, contentW);
    doc.text(wrappedLines, margin, y);
    y += wrappedLines.length * 4;
  }

  // ── Footer ──
  var totalPages = doc.internal.getNumberOfPages();
  for (var p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Generated by Lex \u2014 Scrabble AI Coach | scrabblewordsfinder.com',
      pageW / 2, 290, { align: 'center' }
    );
    doc.text('Page ' + p + ' of ' + totalPages, pageW - margin, 290, { align: 'right' });
  }

  // ── Output ──
  var filename = 'lex-' + type + '-report-' + now.toISOString().slice(0, 10) + '.pdf';
  var blob = doc.output('blob');
  var base64 = doc.output('datauristring');

  return { blob: blob, base64: base64, filename: filename, date: now.toISOString() };
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

function getPhasePercent(phase) {
  if (!phase || typeof phase !== 'object') return '?';
  // Try solveRate first (anagram/cab), then accuracy (quiz), then rate
  var val = phase.solveRate;
  if (typeof val === 'number') return val;
  val = phase.accuracy;
  if (typeof val === 'number') return val;
  val = phase.rate;
  if (typeof val === 'number') return val;
  // Last resort: check for any numeric property
  for (var k in phase) {
    if (typeof phase[k] === 'number' && (k.toLowerCase().indexOf('rate') !== -1 || k.toLowerCase().indexOf('acc') !== -1)) {
      return phase[k];
    }
  }
  return '?';
}

function isSectionHeader(line) {
  // Lines starting with emoji section markers from coaching prompts
  return /^[\u{1F3C6}\u{1F4AA}\u{1F3AF}\u{1F4C8}\u{23F1}\u{1F52E}\u{1F9E0}\u{2B50}]/u.test(line)
    || /^(OVERALL GRADE|STRENGTHS|NEEDS WORK|PROGRESS|TIMING|PREDICTION|WORDS TO LEARN|LEX'S CHALLENGE)/i.test(line);
}

function stripEmoji(text) {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '').trim();
}

function buildStatsLine(type, stats) {
  if (type === 'quiz') {
    return 'Games: ' + (stats.totalGames || 0) +
      ' | Accuracy: ' + (stats.accuracy || 0) + '%' +
      ' | Perfect: ' + (stats.totalPerfect || 0) +
      ' | Avg Time: ' + (stats.avgTime || 0) + 's' +
      ' | Timer Used: ' + (stats.timeUsagePct || 0) + '%';
  }
  if (type === 'rack') {
    return 'Words: ' + (stats.totalWords || 0) +
      ' | Avg Score: ' + (stats.avgScore || 0) + ' pts' +
      ' | Bingos: ' + (stats.bingos || 0) +
      ' | Best: ' + (stats.highWord ? stats.highWord.score + ' pts' : 'N/A');
  }
  if (type === 'anagram') {
    return 'Puzzles: ' + (stats.totalGames || 0) +
      ' | Solve Rate: ' + (stats.solveRate || 0) + '%' +
      ' | Avg Attempts: ' + (stats.avgAttempts || 0) +
      ' | Streak: ' + (stats.streak || 0);
  }
  if (type === 'cab') {
    return 'Games: ' + (stats.totalGames || 0) +
      ' | Solve Rate: ' + (stats.solveRate || 0) + '%' +
      ' | Avg Guesses: ' + (stats.avgAttempts || 0) +
      ' | Quick Solves: ' + (stats.quickSolves || 0);
  }
  return '';
}

function loadImageAsBase64(url) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = function() { resolve(null); };
    img.src = url;
  });
}

// ─── UI HELPERS (Download + Save buttons) ────────────────────────────────────

/**
 * Create and append the Download PDF + Save buttons after a coaching report.
 * @param {HTMLElement} containerEl - The coaching wrapper element to append to
 * @param {string} type - 'quiz' | 'rack' | 'anagram' | 'cab'
 * @param {string} analysis - The AI analysis text
 * @param {Object} stats - Stats from the API
 * @param {Object|null} phases - Phase data
 */
function appendCoachingPDFButtons(containerEl, type, analysis, stats, phases) {
  var btnWrapper = document.createElement('div');
  btnWrapper.className = 'mt-4 flex items-center gap-2 flex-wrap';

  // Download PDF button
  var downloadBtn = document.createElement('button');
  downloadBtn.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/50 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/50 hover:border-emerald-400 transition-colors';
  downloadBtn.innerHTML = '<span aria-hidden="true">\u{1F4E5}</span> Download PDF';
  downloadBtn.setAttribute('data-coach-type', type);

  // Save button (hidden until download succeeds)
  var saveBtn = document.createElement('button');
  saveBtn.className = 'hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-500/50 bg-blue-900/30 text-blue-300 hover:bg-blue-800/50 hover:border-blue-400 transition-colors';
  saveBtn.innerHTML = '<span aria-hidden="true">\u{1F4BE}</span> Save to Library';

  // Status text
  var statusEl = document.createElement('span');
  statusEl.className = 'text-[10px] text-gray-500 hidden';

  btnWrapper.appendChild(downloadBtn);
  btnWrapper.appendChild(saveBtn);
  btnWrapper.appendChild(statusEl);
  containerEl.appendChild(btnWrapper);

  var lastPdfResult = null;

  downloadBtn.addEventListener('click', async function() {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="animate-spin">&#9696;</span> Generating...';

    try {
      var result = await generateCoachingPDF({
        type: type,
        analysis: analysis,
        stats: stats,
        phases: phases
      });

      // Trigger browser download
      var a = document.createElement('a');
      a.href = URL.createObjectURL(result.blob);
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      lastPdfResult = result;
      downloadBtn.innerHTML = '<span aria-hidden="true">\u2705</span> Downloaded';
      downloadBtn.className = downloadBtn.className.replace('emerald', 'green');

      // Show save button
      saveBtn.classList.remove('hidden');
      statusEl.classList.remove('hidden');
      statusEl.textContent = 'PDF ready \u2014 save to your library?';
    } catch (err) {
      downloadBtn.innerHTML = '<span aria-hidden="true">\u274C</span> Failed';
      statusEl.classList.remove('hidden');
      statusEl.textContent = 'Error: ' + (err.message || 'PDF generation failed');
      statusEl.className = 'text-[10px] text-red-400';
    }

    setTimeout(function() { downloadBtn.disabled = false; }, 2000);
  });

  saveBtn.addEventListener('click', function() {
    if (!lastPdfResult) return;

    var typeLabels = { quiz: 'Word Quiz', rack: 'Daily Rack', anagram: 'Anagram', cab: 'Cows & Bulls' };
    var report = {
      id: 'report-' + Date.now(),
      type: type,
      title: typeLabels[type] + ' Report',
      date: lastPdfResult.date,
      filename: lastPdfResult.filename,
      base64: lastPdfResult.base64
    };

    try {
      saveReportToStorage(report);
      saveBtn.innerHTML = '<span aria-hidden="true">\u2705</span> Saved!';
      saveBtn.disabled = true;
      statusEl.innerHTML = 'Saved to library (max 5 reports kept) <a href="/settings/#coaching-reports" style="text-decoration:underline;margin-left:4px" title="Manage Storage">&#128194; Manage Storage</a>';
      statusEl.className = 'text-[10px] text-green-400';
    } catch (err) {
      statusEl.textContent = 'Save failed: ' + (err.message || 'storage full');
      statusEl.className = 'text-[10px] text-red-400';
    }
  });
}
