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

// ===== Mood Scatter Shared Utilities =====

// Category-level color map
const MOOD_CAT_COLORS = {
  very_unpleasant: 'rgba(184,110,110,0.7)',
  unpleasant: 'rgba(184,137,138,0.7)',
  neutral: 'rgba(143,168,134,0.7)',
  pleasant: 'rgba(201,169,110,0.7)',
  very_pleasant: 'rgba(220,190,120,0.7)',
};

const MOOD_CAT_BORDERS = {
  very_unpleasant: '#b86e6e',
  unpleasant: 'var(--accent-rose)',
  neutral: 'var(--accent-sage)',
  pleasant: 'var(--accent-gold)',
  very_pleasant: '#dcbe78',
};

// Helper: resolve moodAfter to a category id (handles both new object format and legacy string)
function resolveMoodCategory(moodAfter) {
  if (!moodAfter) return null;
  if (typeof moodAfter === 'object' && moodAfter.category) {
    return moodAfter.category;
  }
  // Legacy string format
  if (typeof moodAfter === 'string') {
    return MOOD_LEGACY_MAP[moodAfter] || null;
  }
  return null;
}

// Helper: format mood for display (handles both new object and legacy string)
function formatMoodDisplay(mood) {
  if (!mood) return null;
  if (typeof mood === 'object' && mood.category) {
    const cat = MOOD_CATEGORIES.find(c => c.id === mood.category);
    if (!cat) return null;
    return {
      icon: cat.icon,
      name: mood.feelings && mood.feelings.length > 0 ? mood.feelings.join('·') : cat.name,
    };
  }
  // Legacy string format
  if (typeof mood === 'string') {
    const catId = MOOD_LEGACY_MAP[mood];
    if (catId) {
      const cat = MOOD_CATEGORIES.find(c => c.id === catId);
      const oldMood = MOODS.find(m => m.id === mood);
      return cat ? { icon: cat.icon, name: oldMood ? oldMood.name : cat.name } : null;
    }
    const oldMood = MOODS.find(m => m.id === mood);
    return oldMood ? { icon: oldMood.icon, name: oldMood.name } : null;
  }
  return null;
}

function renderEntryCard(e) {
  const type = ALL_TYPES.find(t => t.id === e.type) || ALL_TYPES[0];
  const moodBefore = formatMoodDisplay(e.moodBefore);
  const moodAfter = formatMoodDisplay(e.moodAfter);

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
