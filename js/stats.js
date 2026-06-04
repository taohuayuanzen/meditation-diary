// ===== Stats Page =====

let currentPeriod = 'week'; // 'week' | 'month' | 'all'

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
});

function switchPeriod(period) {
  currentPeriod = period;
  // Update tab active state
  document.querySelectorAll('.stats-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.period === period);
  });
  renderAll();
}

function renderAll() {
  renderWeekDots();
  renderSummary();
  renderPersonalBest();
  renderTypeBreakdown();
}

// ===== Time Period Filtering =====

function filterEntriesByPeriod(entries, period) {
  const now = new Date();
  return entries.filter(e => {
    const d = new Date(e.date);
    if (period === 'all') return true;
    if (period === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (period === 'week') {
      // Natural week: Monday ~ Sunday
      const day = now.getDay() || 7; // Sunday = 7
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return d >= monday && d <= sunday;
    }
    return true;
  });
}

// Get previous period entries for comparison
function filterPreviousPeriod(entries, period) {
  const now = new Date();
  return entries.filter(e => {
    const d = new Date(e.date);
    if (period === 'all') return false; // No comparison for "all"
    if (period === 'month') {
      // Previous month
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    }
    if (period === 'week') {
      // Previous natural week
      const day = now.getDay() || 7;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - day + 1);
      thisMonday.setHours(0, 0, 0, 0);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);
      return d >= lastMonday && d <= lastSunday;
    }
    return false;
  });
}

// ===== Summary Calculation =====

function calcSummary(filtered) {
  const count = filtered.length;
  const minutes = filtered.reduce((sum, e) => sum + (e.duration || 0), 0);
  const uniqueDays = new Set(filtered.map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })).size;
  return { count, minutes, days: uniqueDays };
}

// ===== Type Stats =====

function calcTypeStats(filtered) {
  const map = {}; // typeId -> { count, minutes }
  filtered.forEach(e => {
    if (!map[e.type]) map[e.type] = { count: 0, minutes: 0 };
    map[e.type].count++;
    map[e.type].minutes += e.duration || 0;
  });
  return map;
}

// ===== Personal Best (all-time) =====

function calcPersonalBest(entries) {
  if (entries.length === 0) return { maxStreak: 0, maxDuration: 0 };

  // Max single session duration
  const maxDuration = Math.max(...entries.map(e => e.duration || 0));

  // Max streak
  const dateSet = new Set();
  entries.forEach(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    dateSet.add(d.getTime());
  });

  let maxStreak = 0;
  const sortedDates = [...dateSet].sort((a, b) => a - b);

  // Find max consecutive streak
  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    if (sortedDates[i] - sortedDates[i - 1] === 86400000) {
      streak++;
    } else {
      maxStreak = Math.max(maxStreak, streak);
      streak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, streak);
  if (sortedDates.length === 0) maxStreak = 0;

  return { maxStreak, maxDuration };
}

// ===== Format Duration =====

function formatDuration(minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}小时${m}分` : `${h}小时`;
  }
  return `${minutes}分钟`;
}

// ===== Render: Week Dots =====

function renderWeekDots() {
  const container = document.getElementById('stats-week-dots');
  if (!container) return;

  if (currentPeriod !== 'week') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 1=Mon ... 7=Sun
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Get this week's entry dates
  const entries = loadEntries();
  const weekEntries = filterEntriesByPeriod(entries, 'week');
  const practiceDays = new Set();
  weekEntries.forEach(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    practiceDays.add(d.getTime());
  });

  // Monday of this week
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);

  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  let html = '<div class="stats-week-dots-row">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const hasPractice = practiceDays.has(d.getTime());
    const isFuture = d.getTime() > today.getTime();
    const isToday = d.getTime() === today.getTime();

    let dotCls = 'stats-week-dot';
    if (hasPractice) dotCls += ' practiced';
    if (isFuture) dotCls += ' future';
    if (isToday) dotCls += ' today';

    html += `<div class="${dotCls}">
      <span class="stats-week-dot-circle">${hasPractice ? '●' : '○'}</span>
      <span class="stats-week-dot-label">${dayLabels[i]}</span>
    </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

// ===== Render: Summary Cards =====

function renderSummary() {
  const container = document.getElementById('stats-summary');
  if (!container) return;

  const entries = loadEntries();
  const filtered = filterEntriesByPeriod(entries, currentPeriod);
  const summary = calcSummary(filtered);

  // Previous period comparison
  const prevEntries = filterPreviousPeriod(entries, currentPeriod);
  const prevSummary = calcSummary(prevEntries);

  const cards = [
    {
      value: summary.count,
      label: '次',
      diff: currentPeriod !== 'all' ? summary.count - prevSummary.count : null,
    },
    {
      value: formatDuration(summary.minutes),
      label: '',
      diff: currentPeriod !== 'all' ? summary.minutes - prevSummary.minutes : null,
      isFormatted: true,
    },
    {
      value: summary.days,
      label: '天',
      diff: currentPeriod !== 'all' ? summary.days - prevSummary.days : null,
    },
  ];

  container.innerHTML = cards.map(c => {
    let diffHtml = '';
    if (c.diff !== null && c.diff !== 0) {
      const isUp = c.diff > 0;
      const arrow = isUp ? '↑' : '↓';
      const absVal = Math.abs(c.diff);
      const diffText = c.isFormatted ? formatDuration(absVal) : `${absVal}`;
      diffHtml = `<span class="stats-diff ${isUp ? 'up' : 'down'}">${arrow} ${diffText}</span>`;
    }
    return `<div class="stats-card">
      <div class="stats-card-value">${c.value}<span class="stats-card-unit">${c.label}</span></div>
      ${diffHtml}
    </div>`;
  }).join('');
}

// ===== Render: Personal Best =====

function renderPersonalBest() {
  const container = document.getElementById('stats-personal-best');
  if (!container) return;

  if (currentPeriod !== 'all') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  const entries = loadEntries();
  const best = calcPersonalBest(entries);

  if (best.maxStreak === 0 && best.maxDuration === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <div class="stats-best-row">
      <span class="stats-best-icon">🏆</span>
      <span class="stats-best-text">最长连续 <strong>${best.maxStreak}</strong> 天 · 单次最长 <strong>${formatDuration(best.maxDuration)}</strong></span>
    </div>`;
}

// ===== Render: Type Breakdown =====

function renderTypeBreakdown() {
  const container = document.getElementById('stats-type-list');
  if (!container) return;

  const entries = loadEntries();
  const filtered = filterEntriesByPeriod(entries, currentPeriod);
  const typeStats = calcTypeStats(filtered);

  if (Object.keys(typeStats).length === 0) {
    container.innerHTML = '<div class="stats-type-empty">暂无冥想记录</div>';
    return;
  }

  // Build list in ALL_TYPES order, only those with records
  const items = [];
  let maxMinutes = 0;
  ALL_TYPES.forEach(t => {
    const stat = typeStats[t.id];
    if (stat) {
      items.push({ type: t, count: stat.count, minutes: stat.minutes });
      if (stat.minutes > maxMinutes) maxMinutes = stat.minutes;
    }
  });

  container.innerHTML = items.map(item => {
    const barWidth = maxMinutes > 0 ? Math.round(item.minutes / maxMinutes * 100) : 0;
    return `<div class="stats-type-item">
      <div class="stats-type-info">
        <span class="stats-type-icon">${item.type.icon}</span>
        <span class="stats-type-name">${item.type.name}</span>
      </div>
      <div class="stats-type-bar-wrap">
        <div class="stats-type-bar" style="width:${barWidth}%"></div>
      </div>
      <div class="stats-type-nums">
        <span class="stats-type-count">${item.count}次</span>
        <span class="stats-type-duration">${formatDuration(item.minutes)}</span>
      </div>
    </div>`;
  }).join('');
}
