// ===== Home Page Logic =====

function renderHome() {
  renderGreeting();
  renderWeekDots();
  renderMoodScatter();
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

// ===== Mood Scatter (30-day bubble chart with collision) =====
function renderMoodScatter() {
  const container = document.getElementById('mood-scatter');
  const entries = loadEntries();

  // Filter entries from last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const recentEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d.getTime() >= thirtyDaysAgo.getTime();
  });

  if (recentEntries.length === 0) {
    container.innerHTML = '<div class="mood-scatter-empty">尚无冥想记录<br>轻触上方按钮开始</div>';
    return;
  }

  // Count mood occurrences
  const moodCounts = {};
  recentEntries.forEach(e => {
    if (e.moodAfter) {
      moodCounts[e.moodAfter] = (moodCounts[e.moodAfter] || 0) + 1;
    }
  });

  if (Object.keys(moodCounts).length === 0) {
    container.innerHTML = '<div class="mood-scatter-empty">暂无心情记录</div>';
    return;
  }

  // Find max count for sizing
  const maxCount = Math.max(...Object.values(moodCounts));

  // Mood color map
  const moodColors = {
    calm: 'rgba(143,168,134,0.7)',     // sage
    anxious: 'rgba(184,137,138,0.7)',   // rose
    happy: 'rgba(201,169,110,0.7)',     // gold
    sad: 'rgba(138,172,184,0.7)',       // sky
    tired: 'rgba(160,150,130,0.6)',     // muted
    angry: 'rgba(184,110,110,0.7)',     // warm rose
  };

  const moodBorders = {
    calm: 'var(--accent-sage)',
    anxious: 'var(--accent-rose)',
    happy: 'var(--accent-gold)',
    sad: 'var(--accent-sky)',
    tired: 'var(--text-muted)',
    angry: '#b86e6e',
  };

  // Create bubble data
  const bubbles = [];
  Object.entries(moodCounts).forEach(([moodId, count]) => {
    const mood = MOODS.find(m => m.id === moodId);
    if (!mood) return;
    // Size: min 36px, max 72px, proportional to count
    const ratio = maxCount > 1 ? count / maxCount : 1;
    const size = Math.round(36 + ratio * 36);
    bubbles.push({
      id: moodId,
      icon: mood.icon,
      name: mood.name,
      count,
      size,
      color: moodColors[moodId] || 'rgba(160,150,130,0.6)',
      border: moodBorders[moodId] || 'var(--text-muted)',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    });
  });

  // Sort by size (largest first for better layout)
  bubbles.sort((a, b) => b.size - a.size);

  // Clear container
  container.innerHTML = '';

  // Get container dimensions
  const rect = container.getBoundingClientRect();
  const W = rect.width || 320;
  const H = rect.height || 180;

  // Place bubbles using simple grid + jitter initial placement
  const padding = 20;
  const placeArea = { x: padding, y: padding, w: W - padding * 2, h: H - padding * 2 };

  // Initial placement: spread across container
  bubbles.forEach((b, i) => {
    const cols = Math.ceil(Math.sqrt(bubbles.length));
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cellW = placeArea.w / cols;
    const cellH = placeArea.h / Math.ceil(bubbles.length / cols);
    b.x = placeArea.x + col * cellW + cellW / 2 - b.size / 2;
    b.y = placeArea.y + row * cellH + cellH / 2 - b.size / 2;
    // Add small random jitter
    b.x += (Math.random() - 0.5) * 10;
    b.y += (Math.random() - 0.5) * 10;
    // Clamp to container
    b.x = Math.max(padding, Math.min(W - b.size - padding, b.x));
    b.y = Math.max(padding, Math.min(H - b.size - padding, b.y));
  });

  // Simple collision resolution (iterative)
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
        const minDist = (a.size + b.size) / 2 + 4; // 4px gap
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
      // Clamp each bubble to container
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
    el.innerHTML = `
      <span style="font-size:${Math.max(1, b.size / 3)}px;line-height:1">${b.icon}</span>
      <span class="mood-bubble-label">${b.name} ${b.count}</span>
    `;
    container.appendChild(el);
  });

  // Add subtle floating animation
  startBubbleFloat(container, bubbles, W, H, padding);
}

// ===== Gentle floating animation with collision =====
function startBubbleFloat(container, bubbles, W, H, padding) {
  // Give each bubble a small velocity
  bubbles.forEach(b => {
    b.vx = (Math.random() - 0.5) * 0.3;
    b.vy = (Math.random() - 0.5) * 0.3;
  });

  let animId = null;
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
          // Elastic-ish bounce
          const nx = dx / dist;
          const ny = dy / dist;
          // Separate
          const overlap = minDist - dist;
          a.x -= nx * overlap / 2;
          a.y -= ny * overlap / 2;
          b.x += nx * overlap / 2;
          b.y += ny * overlap / 2;
          // Swap velocity components along collision normal
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

    animId = requestAnimationFrame(tick);
  }

  // Start animation
  animId = requestAnimationFrame(tick);

  // Pause when not visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !running) {
        running = true;
        animId = requestAnimationFrame(tick);
      } else if (!e.isIntersecting && running) {
        running = false;
        if (animId) cancelAnimationFrame(animId);
      }
    });
  });
  observer.observe(container);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', renderHome);
