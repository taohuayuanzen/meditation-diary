// ===== Stats Page =====

let currentPeriod = 'week'; // 'week' | 'month' | 'all'
let weekOffset = 0;  // 0=本周, -1=上周, -2=上上周...
let monthOffset = 0; // 0=本月, -1=上月, -2=上上月...

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
});

function switchPeriod(period) {
  currentPeriod = period;
  weekOffset = 0;
  monthOffset = 0;
  // Update tab active state
  document.querySelectorAll('.stats-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.period === period);
  });
  renderAll();
}

function switchWeek(delta) {
  weekOffset += delta;
  if (weekOffset > 0) weekOffset = 0;
  renderAll();
}

function switchMonth(delta) {
  monthOffset += delta;
  if (monthOffset > 0) monthOffset = 0;
  renderAll();
}

// Get Monday & Sunday of a given week offset (0=this week, -1=last week, etc.)
function getWeekRange(offset) {
  const now = new Date();
  const day = now.getDay() || 7; // Sunday = 7
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - day + 1);
  thisMonday.setHours(0, 0, 0, 0);
  const targetMonday = new Date(thisMonday);
  targetMonday.setDate(thisMonday.getDate() + offset * 7);
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);
  targetSunday.setHours(23, 59, 59, 999);
  return { monday: targetMonday, sunday: targetSunday };
}

// Get first & last day of a given month offset (0=this month, -1=last month, etc.)
function getMonthRange(offset) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const firstDay = new Date(target.getFullYear(), target.getMonth(), 1);
  firstDay.setHours(0, 0, 0, 0);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  return { firstDay, lastDay };
}

function renderAll() {
  renderWeekNav();
  renderMonthNav();
  renderWeekDots();
  renderSummary();
  renderPersonalBest();
  renderDurationBreakdown();
  renderCountBreakdown();
  renderAvgBreakdown();
}

// ===== Time Period Filtering =====

function filterEntriesByPeriod(entries, period) {
  return entries.filter(e => {
    const d = new Date(e.date);
    if (period === 'all') return true;
    if (period === 'month') {
      const { firstDay, lastDay } = getMonthRange(monthOffset);
      return d >= firstDay && d <= lastDay;
    }
    if (period === 'week') {
      const { monday, sunday } = getWeekRange(weekOffset);
      return d >= monday && d <= sunday;
    }
    return true;
  });
}

// Get previous period entries for comparison
function filterPreviousPeriod(entries, period) {
  return entries.filter(e => {
    const d = new Date(e.date);
    if (period === 'all') return false;
    if (period === 'month') {
      const { firstDay, lastDay } = getMonthRange(monthOffset - 1);
      return d >= firstDay && d <= lastDay;
    }
    if (period === 'week') {
      const { monday, sunday } = getWeekRange(weekOffset - 1);
      return d >= monday && d <= sunday;
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

// ===== Personal Best =====

function calcPersonalBest(entries) {
  if (entries.length === 0) return { maxStreak: 0, maxDuration: 0 };

  const maxDuration = Math.max(...entries.map(e => e.duration || 0));

  const dateSet = new Set();
  entries.forEach(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    dateSet.add(d.getTime());
  });

  let maxStreak = 0;
  const sortedDates = [...dateSet].sort((a, b) => a - b);

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
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  }
  return `${minutes}分钟`;
}

// ===== Render: Week Navigation =====

function renderWeekNav() {
  const container = document.getElementById('stats-week-nav');
  if (!container) return;

  if (currentPeriod !== 'week') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  const { monday, sunday } = getWeekRange(weekOffset);
  const m = monday.getMonth() + 1;
  const md = monday.getDate();
  const sd = sunday.getDate();

  let label;
  if (monday.getMonth() === sunday.getMonth()) {
    label = `${m}.${md} ~ ${m}.${sd}`;
  } else {
    const sm = sunday.getMonth() + 1;
    label = `${m}.${md} ~ ${sm}.${sd}`;
  }

  const subLabel = weekOffset === 0 ? '本周' : '';

  container.innerHTML = `
    <button class="stats-period-nav-btn" onclick="switchWeek(-1)" title="上一周">←</button>
    <div class="stats-period-nav-label-group">
      <span class="stats-period-nav-label">${label}</span>
      ${subLabel ? `<span class="stats-period-nav-sub">${subLabel}</span>` : ''}
    </div>
    <button class="stats-period-nav-btn" onclick="switchWeek(1)" title="下一周" ${weekOffset >= 0 ? 'disabled' : ''}>→</button>
  `;
}

// ===== Render: Month Navigation =====

function renderMonthNav() {
  const container = document.getElementById('stats-month-nav');
  if (!container) return;

  if (currentPeriod !== 'month') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  const { firstDay } = getMonthRange(monthOffset);
  const year = firstDay.getFullYear();
  const month = firstDay.getMonth() + 1;
  const label = `${year}年${month}月`;
  const subLabel = monthOffset === 0 ? '本月' : '';

  container.innerHTML = `
    <button class="stats-period-nav-btn" onclick="switchMonth(-1)" title="上一月">←</button>
    <div class="stats-period-nav-label-group">
      <span class="stats-period-nav-label">${label}</span>
      ${subLabel ? `<span class="stats-period-nav-sub">${subLabel}</span>` : ''}
    </div>
    <button class="stats-period-nav-btn" onclick="switchMonth(1)" title="下一月" ${monthOffset >= 0 ? 'disabled' : ''}>→</button>
  `;
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
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const entries = loadEntries();
  const weekEntries = filterEntriesByPeriod(entries, 'week');
  const practiceDays = new Set();
  weekEntries.forEach(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    practiceDays.add(d.getTime());
  });

  const { monday } = getWeekRange(weekOffset);

  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  let html = '<div class="stats-week-dots-row">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const hasPractice = practiceDays.has(d.getTime());
    const isFuture = weekOffset === 0 && d.getTime() > today.getTime();
    const isToday = weekOffset === 0 && d.getTime() === today.getTime();

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

  container.style.display = '';

  const entries = loadEntries();
  const filtered = filterEntriesByPeriod(entries, currentPeriod);
  const best = calcPersonalBest(filtered);

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

// ===== Render: Duration Breakdown =====

function renderDurationBreakdown() {
  const container = document.getElementById('stats-duration-list');
  if (!container) return;

  const entries = loadEntries();
  const filtered = filterEntriesByPeriod(entries, currentPeriod);
  const typeStats = calcTypeStats(filtered);

  if (Object.keys(typeStats).length === 0) {
    container.innerHTML = '<div class="stats-type-empty">暂无冥想记录</div>';
    return;
  }

  const items = [];
  let totalMinutes = 0;
  ALL_TYPES.forEach(t => {
    const stat = typeStats[t.id];
    if (stat) {
      items.push({ type: t, count: stat.count, minutes: stat.minutes });
      totalMinutes += stat.minutes;
    }
  });

  items.sort((a, b) => b.minutes - a.minutes);
  const maxMinutes = items.length > 0 ? items[0].minutes : 0;

  let html = `<div class="stats-type-item stats-type-total">
    <div class="stats-type-info">
      <span class="stats-type-name">总计</span>
    </div>
    <div class="stats-type-nums">
      <span class="stats-type-duration">${formatDuration(totalMinutes)}</span>
    </div>
  </div>`;

  html += items.map(item => {
    const barWidth = maxMinutes > 0 ? Math.round(item.minutes / maxMinutes * 100) : 0;
    return `<div class="stats-type-item">
      <div class="stats-type-info">
        <span class="stats-type-name">${item.type.name}</span>
      </div>
      <div class="stats-type-bar-wrap">
        <div class="stats-type-bar" style="width:${barWidth}%"></div>
      </div>
      <div class="stats-type-nums">
        <span class="stats-type-duration">${formatDuration(item.minutes)}</span>
      </div>
    </div>`;
  }).join('');

  container.innerHTML = html;
}

// ===== Render: Count Breakdown =====

function renderCountBreakdown() {
  const container = document.getElementById('stats-count-list');
  if (!container) return;

  const entries = loadEntries();
  const filtered = filterEntriesByPeriod(entries, currentPeriod);
  const typeStats = calcTypeStats(filtered);

  if (Object.keys(typeStats).length === 0) {
    container.innerHTML = '<div class="stats-type-empty">暂无冥想记录</div>';
    return;
  }

  const items = [];
  let totalCount = 0;
  ALL_TYPES.forEach(t => {
    const stat = typeStats[t.id];
    if (stat) {
      items.push({ type: t, count: stat.count, minutes: stat.minutes });
      totalCount += stat.count;
    }
  });

  items.sort((a, b) => b.count - a.count);
  const maxCount = items.length > 0 ? items[0].count : 0;

  let html = `<div class="stats-type-item stats-type-total">
    <div class="stats-type-info">
      <span class="stats-type-name">总计</span>
    </div>
    <div class="stats-type-nums">
      <span class="stats-type-count">${totalCount}</span>
    </div>
  </div>`;

  html += items.map(item => {
    const barWidth = maxCount > 0 ? Math.round(item.count / maxCount * 100) : 0;
    return `<div class="stats-type-item">
      <div class="stats-type-info">
        <span class="stats-type-name">${item.type.name}</span>
      </div>
      <div class="stats-type-bar-wrap">
        <div class="stats-type-bar" style="width:${barWidth}%"></div>
      </div>
      <div class="stats-type-nums">
        <span class="stats-type-count">${item.count}</span>
      </div>
    </div>`;
  }).join('');

  container.innerHTML = html;
}

// ===== Render: Avg Duration Per Session Breakdown =====

function renderAvgBreakdown() {
  const container = document.getElementById('stats-avg-list');
  if (!container) return;

  const entries = loadEntries();
  const filtered = filterEntriesByPeriod(entries, currentPeriod);
  const typeStats = calcTypeStats(filtered);

  if (Object.keys(typeStats).length === 0) {
    container.innerHTML = '<div class="stats-type-empty">暂无冥想记录</div>';
    return;
  }

  const items = [];
  let totalCount = 0, totalMinutes = 0;
  ALL_TYPES.forEach(t => {
    const stat = typeStats[t.id];
    if (stat) {
      const avg = stat.count > 0 ? stat.minutes / stat.count : 0;
      items.push({ type: t, count: stat.count, minutes: stat.minutes, avg });
      totalCount += stat.count;
      totalMinutes += stat.minutes;
    }
  });

  items.sort((a, b) => b.avg - a.avg);
  const maxAvg = items.length > 0 ? items[0].avg : 0;
  const totalAvg = totalCount > 0 ? totalMinutes / totalCount : 0;

  let html = `<div class="stats-type-item stats-type-total">
    <div class="stats-type-info">
      <span class="stats-type-name">平均</span>
    </div>
    <div class="stats-type-nums">
      <span class="stats-type-duration">${formatDuration(Math.round(totalAvg))}</span>
    </div>
  </div>`;

  html += items.map(item => {
    const barWidth = maxAvg > 0 ? Math.round(item.avg / maxAvg * 100) : 0;
    return `<div class="stats-type-item">
      <div class="stats-type-info">
        <span class="stats-type-name">${item.type.name}</span>
      </div>
      <div class="stats-type-bar-wrap">
        <div class="stats-type-bar" style="width:${barWidth}%"></div>
      </div>
      <div class="stats-type-nums">
        <span class="stats-type-duration">${formatDuration(Math.round(item.avg))}</span>
      </div>
    </div>`;
  }).join('');

  container.innerHTML = html;
}
