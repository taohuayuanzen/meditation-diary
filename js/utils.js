// ===== Utility Functions =====
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' });
}

function formatDateTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) +
    ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');
}

function escapeForJs(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function renderEntryCard(e) {
  const type = ALL_TYPES.find(t => t.id === e.type) || ALL_TYPES[0];
  const moodBefore = MOODS.find(m => m.id === e.moodBefore);
  const moodAfter = MOODS.find(m => m.id === e.moodAfter);

  const moodDisplay = [];
  if (moodBefore) moodDisplay.push(`<span>${moodBefore.icon} ${moodBefore.name}</span>`);
  if (moodBefore && moodAfter) moodDisplay.push(`<span class="mood-arrow">→</span>`);
  if (moodAfter) moodDisplay.push(`<span>${moodAfter.icon} ${moodAfter.name}</span>`);

  return `
    <div class="entry-card" onclick="showDetail('${e.id}')">
      <div class="entry-card-header">
        <span class="entry-type-badge ${type.badge}">${type.name}</span>
        <span class="entry-date">${formatDate(e.date)}</span>
      </div>
      ${moodDisplay.length ? `<div class="entry-moods">${moodDisplay.join('')}</div>` : ''}
      ${e.insight ? `<div class="entry-insight">${escapeHtml(e.insight)}</div>` : ''}
      <div class="entry-duration">${e.duration} 分钟</div>
    </div>`;
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (let i = 0; i < text.length; i++) {
    const testLine = line + text[i];
    const metrics = ctx.measureText(testLine);
    if (text[i] === '\n') { lines.push(line); line = ''; continue; }
    if (metrics.width > maxWidth && line !== '') { lines.push(line); line = text[i]; }
    else { line = testLine; }
  }
  if (line) lines.push(line);
  return lines;
}
