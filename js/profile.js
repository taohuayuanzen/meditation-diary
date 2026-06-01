// ===== Profile Page ("我的") =====

let calYear, calMonth; // current calendar view
let selectedDate = null; // selected date string 'YYYY-MM-DD'

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth(); // 0-indexed

  renderProfileStats();
  renderCalendar();
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
    const mood = MOODS.find(m => m.id === e.moodAfter);
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

// ===== Helpers =====
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
