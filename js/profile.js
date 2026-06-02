// ===== Profile Page ("我的") =====

let calYear, calMonth; // current calendar view
let selectedDate = null; // selected date string 'YYYY-MM-DD'
let _scatterAnim = null; // scatter animation frame id

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth(); // 0-indexed

  renderProfileStats();
  renderCalendar();
  renderMoodScatter();
});

// ===== Stats =====
function renderProfileStats() {
  const entries = loadEntries();
  const stats = calcStats();

  // 总天数：有多少个不同的日期有冥想记录
  const uniqueDays = new Set(entries.map(e => {
    const d = new Date(e.date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })).size;

  document.getElementById('p-total').textContent = uniqueDays;
  document.getElementById('p-minutes').textContent = stats.minutes;
  document.getElementById('p-streak').textContent = stats.streak;
  document.getElementById('p-month').textContent = stats.total;
}

// ===== Calendar =====
function changeMonth(delta) {
  calMonth += delta;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  selectedDate = null;
  renderCalendar();
  renderDayDetail();
  renderMoodScatter();
}

function renderCalendar() {
  // Month label
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  document.getElementById('calendar-month-label').textContent = `${calYear}年 ${monthNames[calMonth]}`;

  // Build date -> entries map for this month
  const entries = loadEntries();
  const dateMap = {}; // 'YYYY-MM-DD' -> { count, minutes, hasEntry }
  entries.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
      const key = formatDateKey(d);
      if (!dateMap[key]) dateMap[key] = { count: 0, minutes: 0, hasEntry: true };
      dateMap[key].count++;
      dateMap[key].minutes += (e.duration || 0);
    }
  });

  // Subtitle: how many days this month had meditation
  const meditationDays = Object.keys(dateMap).length;
  document.getElementById('calendar-month-sub').textContent = `本月冥想 ${meditationDays} 天`;

  // Calculate grid
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  const todayKey = formatDateKey(today);

  let html = '';
  // Empty cells before 1st
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-day cal-day-empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const info = dateMap[dateKey];
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === selectedDate;
    const hasEntry = !!info;

    let cls = 'cal-day';
    if (isToday) cls += ' cal-day-today';
    if (hasEntry) cls += ' cal-day-has-entry';
    if (isSelected) cls += ' cal-day-selected';

    html += `<div class="${cls}" onclick="selectDate('${dateKey}')">
      <span class="cal-day-num">${d}</span>
      ${hasEntry ? '<span class="cal-day-dot"></span>' : ''}
    </div>`;
  }

  document.getElementById('calendar-days').innerHTML = html;
}

function selectDate(dateKey) {
  selectedDate = (selectedDate === dateKey) ? null : dateKey;
  renderCalendar();
  renderDayDetail();
}

function renderDayDetail() {
  const container = document.getElementById('calendar-day-detail');
  if (!selectedDate) {
    container.innerHTML = '';
    return;
  }

  const entries = loadEntries().filter(e => {
    const d = new Date(e.date);
    return formatDateKey(d) === selectedDate;
  });

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="cal-detail-empty">
        <p>当日无冥想记录</p>
      </div>`;
    return;
  }

  // Format selected date for display
  const parts = selectedDate.split('-');
  const displayDate = `${parseInt(parts[1])}月${parseInt(parts[2])}日`;

  let html = `<div class="cal-detail-header">${displayDate} · ${entries.length}次冥想</div>`;
  html += entries.map(e => {
    const type = ALL_TYPES.find(t => t.id === e.type);
    const typeName = type ? type.name : e.type;
    const typeIcon = type ? type.icon : '🕯';
    const mood = formatMoodDisplay(e.moodAfter);
    const moodIcon = mood ? mood.icon : '';

    return `<div class="cal-detail-entry">
      <div class="cal-detail-entry-left">
        <span class="cal-detail-icon">${typeIcon}</span>
        <div class="cal-detail-info">
          <span class="cal-detail-type">${typeName}</span>
          <span class="cal-detail-dur">${e.duration || 0}分钟</span>
        </div>
      </div>
      <div class="cal-detail-entry-right">
        ${moodIcon ? `<span class="cal-detail-mood">${moodIcon}</span>` : ''}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = html;
}

// ===== Mood Scatter (per calendar month) =====

function renderMoodScatter() {
  const container = document.getElementById('mood-scatter');
  const entries = loadEntries();

  // Update title with current month
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const titleEl = document.getElementById('mood-scatter-title');
  if (titleEl) titleEl.textContent = `${calYear}年${monthNames[calMonth]}心情`;

  // Stop previous animation
  if (_scatterAnim) {
    cancelAnimationFrame(_scatterAnim);
    _scatterAnim = null;
  }

  // Filter entries for the selected calendar month
  const monthEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });

  if (monthEntries.length === 0) {
    container.innerHTML = '<div class="mood-scatter-empty">当月尚无冥想记录<br>轻触上方按钮开始</div>';
    return;
  }

  // Count mood occurrences by category
  const catCounts = {};
  const catFeelings = {};
  monthEntries.forEach(e => {
    const catId = resolveMoodCategory(e.moodAfter);
    if (catId) {
      catCounts[catId] = (catCounts[catId] || 0) + 1;
      if (e.moodAfter && typeof e.moodAfter === 'object' && e.moodAfter.feelings) {
        if (!catFeelings[catId]) catFeelings[catId] = new Set();
        e.moodAfter.feelings.forEach(f => catFeelings[catId].add(f));
      }
    }
  });

  if (Object.keys(catCounts).length === 0) {
    container.innerHTML = '<div class="mood-scatter-empty">暂无心情记录</div>';
    return;
  }

  // Find max count for sizing
  const maxCount = Math.max(...Object.values(catCounts));

  // Create bubble data
  const bubbles = [];
  Object.entries(catCounts).forEach(([catId, count]) => {
    const cat = MOOD_CATEGORIES.find(c => c.id === catId);
    if (!cat) return;
    const ratio = maxCount > 1 ? count / maxCount : 1;
    const size = Math.round(36 + ratio * 36);
    const feelingList = catFeelings[catId] ? [...catFeelings[catId]].slice(0, 4).join('·') : cat.name;
    bubbles.push({
      id: catId,
      icon: cat.icon,
      name: cat.name,
      count,
      feelingList,
      size,
      color: MOOD_CAT_COLORS[catId] || 'rgba(160,150,130,0.6)',
      border: MOOD_CAT_BORDERS[catId] || 'var(--text-muted)',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    });
  });

  // Sort by size (largest first)
  bubbles.sort((a, b) => b.size - a.size);

  // Clear container
  container.innerHTML = '';

  // Get container dimensions
  const rect = container.getBoundingClientRect();
  const W = rect.width || 320;
  const H = rect.height || 180;

  // Place bubbles using grid + jitter
  const padding = 20;
  const placeArea = { x: padding, y: padding, w: W - padding * 2, h: H - padding * 2 };

  bubbles.forEach((b, i) => {
    const cols = Math.ceil(Math.sqrt(bubbles.length));
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cellW = placeArea.w / cols;
    const cellH = placeArea.h / Math.ceil(bubbles.length / cols);
    b.x = placeArea.x + col * cellW + cellW / 2 - b.size / 2;
    b.y = placeArea.y + row * cellH + cellH / 2 - b.size / 2;
    b.x += (Math.random() - 0.5) * 10;
    b.y += (Math.random() - 0.5) * 10;
    b.x = Math.max(padding, Math.min(W - b.size - padding, b.x));
    b.y = Math.max(padding, Math.min(H - b.size - padding, b.y));
  });

  // Simple collision resolution
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i];
        const b = bubbles[j];
        const aCx = a.x + a.size / 2;
        const aCy = a.y + a.size / 2;
        const bCx = b.x + b.size / 2;
        const bCy = b.y + b.size / 2;
        const dx = bCx - aCx;
        const dy = bCy - aCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (a.size + b.size) / 2 + 4;
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const push = overlap / 2 + 0.5;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
          moved = true;
        }
      }
      const b = bubbles[i];
      b.x = Math.max(padding, Math.min(W - b.size - padding, b.x));
      b.y = Math.max(padding, Math.min(H - b.size - padding, b.y));
    }
    if (!moved) break;
  }

  // Render bubbles
  bubbles.forEach((b, i) => {
    const el = document.createElement('div');
    el.className = 'mood-bubble';
    el.style.width = b.size + 'px';
    el.style.height = b.size + 'px';
    el.style.left = b.x + 'px';
    el.style.top = b.y + 'px';
    el.style.background = b.color;
    el.style.border = `2px solid ${b.border}`;
    el.style.animationDelay = (i * 0.08) + 's';
    el.title = b.feelingList;
    el.innerHTML = `
      <span style="font-size:${Math.max(1, b.size / 3)}px;line-height:1">${b.icon}</span>
      <span class="mood-bubble-label">${b.feelingList} ${b.count}</span>
    `;
    container.appendChild(el);
  });

  // Start floating animation
  startBubbleFloat(container, bubbles, W, H, padding);
}

// ===== Gentle floating animation with collision =====
function startBubbleFloat(container, bubbles, W, H, padding) {
  bubbles.forEach(b => {
    b.vx = (Math.random() - 0.5) * 0.3;
    b.vy = (Math.random() - 0.5) * 0.3;
  });

  let running = true;

  function tick() {
    if (!running) return;

    // Move
    bubbles.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
    });

    // Bounce off walls
    bubbles.forEach(b => {
      if (b.x < padding) { b.x = padding; b.vx = Math.abs(b.vx); }
      if (b.x > W - b.size - padding) { b.x = W - b.size - padding; b.vx = -Math.abs(b.vx); }
      if (b.y < padding) { b.y = padding; b.vy = Math.abs(b.vy); }
      if (b.y > H - b.size - padding) { b.y = H - b.size - padding; b.vy = -Math.abs(b.vy); }
    });

    // Collision between bubbles
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i];
        const b = bubbles[j];
        const aCx = a.x + a.size / 2;
        const aCy = a.y + a.size / 2;
        const bCx = b.x + b.size / 2;
        const bCy = b.y + b.size / 2;
        const dx = bCx - aCx;
        const dy = bCy - aCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (a.size + b.size) / 2 + 4;
        if (dist < minDist && dist > 0.01) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          a.x -= nx * overlap / 2;
          a.y -= ny * overlap / 2;
          b.x += nx * overlap / 2;
          b.y += ny * overlap / 2;
          const relVx = a.vx - b.vx;
          const relVy = a.vy - b.vy;
          const relDot = relVx * nx + relVy * ny;
          if (relDot > 0) {
            a.vx -= relDot * nx * 0.5;
            a.vy -= relDot * ny * 0.5;
            b.vx += relDot * nx * 0.5;
            b.vy += relDot * ny * 0.5;
          }
        }
      }
    }

    // Apply positions to DOM
    const els = container.querySelectorAll('.mood-bubble');
    els.forEach((el, i) => {
      if (bubbles[i]) {
        el.style.left = bubbles[i].x + 'px';
        el.style.top = bubbles[i].y + 'px';
      }
    });

    _scatterAnim = requestAnimationFrame(tick);
  }

  _scatterAnim = requestAnimationFrame(tick);

  // Pause when not visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !running) {
        running = true;
        _scatterAnim = requestAnimationFrame(tick);
      } else if (!e.isIntersecting && running) {
        running = false;
        if (_scatterAnim) cancelAnimationFrame(_scatterAnim);
      }
    });
  });
  observer.observe(container);
}

// ===== Helpers =====
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
