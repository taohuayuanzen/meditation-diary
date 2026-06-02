// ===== Home Page Logic =====

function renderHome() {
  renderGreeting();
  renderWeekDots();
  renderWisdomQuote();
}

// ===== Greeting =====
function renderGreeting() {
  const hour = new Date().getHours();
  let greeting, sub;
  if (hour < 6) { greeting = '夜深人静'; sub = '在寂静中寻得安宁'; }
  else if (hour < 9) { greeting = '清晨安好'; sub = '以正念开启新的一天'; }
  else if (hour < 12) { greeting = '午前时光'; sub = '让心安住于当下'; }
  else if (hour < 14) { greeting = '正午时分'; sub = '片刻静坐，重新出发'; }
  else if (hour < 18) { greeting = '午后宁静'; sub = '在忙碌中留一片净土'; }
  else if (hour < 21) { greeting = '傍晚安宁'; sub = '回顾一日，感恩当下'; }
  else { greeting = '夜幕降临'; sub = '以冥想结束这一天'; }

  document.getElementById('greeting-text').textContent = greeting;
  document.getElementById('greeting-sub').textContent = sub;
}

// ===== Week Dots (7 circles for Mon-Sun, compact) =====
function renderWeekDots() {
  const entries = loadEntries();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get this week's Monday
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  // Build set of dates that have entries this week
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    weekDates.push(d);
  }

  const entryDateSet = new Set();
  entries.forEach(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    entryDateSet.add(d.getTime());
  });

  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  const todayTime = today.getTime();

  const container = document.getElementById('week-dots');
  container.innerHTML = '<div class="week-dot-row">' + weekDates.map((d, i) => {
    const hasEntry = entryDateSet.has(d.getTime());
    const isToday = d.getTime() === todayTime;
    let circleCls = 'week-dot-circle';
    if (hasEntry) circleCls += ' filled';
    else if (isToday) circleCls += ' today-empty';
    let labelCls = 'week-dot-label';
    if (isToday) labelCls += ' today';
    return `
      <div class="week-dot-item">
        <div class="${circleCls}"></div>
        <span class="${labelCls}">${dayLabels[i]}</span>
      </div>
    `;
  }).join('') + '</div>';
}

// ===== Daily Wisdom Quote =====
function renderWisdomQuote() {
  const container = document.getElementById('wisdom-section');

  // Use today's date as seed for consistent daily quote
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const quoteIndex = seed % WISDOM_QUOTES.length;
  const q = WISDOM_QUOTES[quoteIndex];

  container.innerHTML = `
    <div class="wisdom-card">
      <div class="wisdom-deco">❝</div>
      <p class="wisdom-text">${q.quote}</p>
      <div class="wisdom-author">
        <span class="wisdom-author-name">${q.author}</span>
        <span class="wisdom-author-title">${q.title}</span>
      </div>
    </div>
  `;
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', renderHome);
