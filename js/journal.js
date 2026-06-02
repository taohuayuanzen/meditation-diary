// ===== Journal Page Logic =====
let journalYear, journalMonth; // 0-indexed month
let journalFilter = 'all';

function initJournalDate() {
  const now = new Date();
  journalYear = now.getFullYear();
  journalMonth = now.getMonth();
}

function renderJournal() {
  if (journalYear === undefined) initJournalDate();

  // Update month label
  const label = document.getElementById('journal-month-label');
  label.textContent = `${journalYear}年${journalMonth + 1}月`;

  // Filter entries for current month
  const allEntries = loadEntries();
  let monthEntries = allEntries.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === journalYear && d.getMonth() === journalMonth;
  });

  // Build type filters based on this month's entries
  const usedTypeIds = [...new Set(monthEntries.map(e => e.type))];
  const usedTypes = usedTypeIds
    .map(id => ALL_TYPES.find(t => t.id === id))
    .filter(Boolean);

  const allFilters = [
    { id: 'all', name: '全部' },
    ...usedTypes.map(t => ({ id: t.id, name: t.name }))
  ];

  const filters = document.getElementById('journal-filters');
  filters.innerHTML = allFilters.map(f => `
    <button class="filter-chip${journalFilter === f.id ? ' active' : ''}"
            onclick="setJournalFilter('${f.id}')">${f.name}</button>
  `).join('');

  // Apply type filter
  if (journalFilter !== 'all') {
    monthEntries = monthEntries.filter(e => e.type === journalFilter);
  }

  const container = document.getElementById('journal-entries');

  if (monthEntries.length === 0) {
    container.innerHTML = `
      <div class="journal-empty">
        <div class="journal-empty-icon">🪷</div>
        <p>本月暂无冥想记录</p>
      </div>`;
    return;
  }

  // Sort by date descending
  monthEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by date
  const grouped = {};
  monthEntries.forEach(e => {
    const day = new Date(e.date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });

  let html = '';
  for (const [day, dayEntries] of Object.entries(grouped)) {
    html += `<div class="section-header"><h2>${day}</h2></div>`;
    html += dayEntries.map(e => renderEntryCard(e)).join('');
  }

  container.innerHTML = html;
}

function setJournalFilter(id) {
  journalFilter = id;
  renderJournal();
}

function changeMonth(delta) {
  journalFilter = 'all';
  journalMonth += delta;
  if (journalMonth < 0) {
    journalMonth = 11;
    journalYear--;
  } else if (journalMonth > 11) {
    journalMonth = 0;
    journalYear++;
  }
  renderJournal();
}

// ===== Detail Modal =====

// formatMoodDisplay is defined in utils.js (shared across pages)

function showDetail(id) {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  const type = ALL_TYPES.find(t => t.id === entry.type) || ALL_TYPES[0];
  const moodBefore = formatMoodDisplay(entry.moodBefore);
  const moodAfter = formatMoodDisplay(entry.moodAfter);

  const sheet = document.getElementById('detail-sheet');
  sheet.innerHTML = `
    <div class="modal-handle"></div>
    <div class="detail-header">
      <div>
        <span class="detail-type ${type.badge}">${type.name}</span>
        <div class="detail-date">${formatDateTime(entry.date)}</div>
      </div>
      <button class="modal-close" onclick="closeDetail()">✕</button>
    </div>

    <div class="detail-duration">冥想时长：${entry.duration} 分钟</div>

    ${(moodBefore || moodAfter) ? `
      <div class="detail-moods-section">
        ${moodBefore ? `
          <div class="detail-mood">
            <span class="detail-mood-icon">${moodBefore.icon}</span>
            <span class="detail-mood-label">前 ${moodBefore.name}</span>
          </div>
        ` : ''}
        ${moodBefore && moodAfter ? `<div class="detail-mood-arrow">→</div>` : ''}
        ${moodAfter ? `
          <div class="detail-mood">
            <span class="detail-mood-icon">${moodAfter.icon}</span>
            <span class="detail-mood-label">后 ${moodAfter.name}</span>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${entry.insight ? `
      <div class="detail-insight-label">冥想感悟</div>
      <div class="detail-insight-text">${escapeHtml(entry.insight)}</div>
    ` : ''}

    <button class="share-btn" onclick="showShare('${entry.id}')">
      ✦ 分享感悟
    </button>

    <div style="margin-top: 16px; text-align: center;">
      <button style="background: none; border: none; color: var(--accent-rose); font-family: var(--font-serif); font-size: 0.75rem; cursor: pointer; padding: 8px 16px; opacity: 0.7;" onclick="confirmDeleteEntry('${entry.id}')">删除记录</button>
    </div>
  `;

  document.getElementById('detail-modal').classList.add('active');
}

function closeDetail() {
  document.getElementById('detail-modal').classList.remove('active');
}

function confirmDeleteEntry(id) {
  if (confirm('确定要删除这条冥想记录吗？')) {
    deleteEntry(id);
    closeDetail();
    renderJournal();
    showToast('记录已删除');
  }
}

// ===== Share =====
function showShare(id) {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  closeDetail();

  const type = ALL_TYPES.find(t => t.id === entry.type) || ALL_TYPES[0];
  const moodBefore = formatMoodDisplay(entry.moodBefore);
  const moodAfter = formatMoodDisplay(entry.moodAfter);

  const insightText = entry.insight || '在宁静中遇见自己';
  const dateStr = formatDate(entry.date);

  // Build mood text for share
  let moodText = '';
  if (moodBefore && moodAfter) {
    moodText = `${moodBefore.icon} ${moodBefore.name} → ${moodAfter.icon} ${moodAfter.name}`;
  } else if (moodAfter) {
    moodText = `${moodAfter.icon} ${moodAfter.name}`;
  }

  const sheet = document.getElementById('share-sheet');
  sheet.innerHTML = `
    <div class="modal-handle"></div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="font-size: 1rem; font-weight: 400;">分享感悟</h2>
      <button class="modal-close" onclick="closeShare()">✕</button>
    </div>

    <div class="share-card-preview">
      <div class="share-brand">禅心 · 冥想日记</div>
      <div class="share-insight-text">${escapeHtml(insightText)}</div>
      <div class="share-meta">${type.name} · ${entry.duration}分钟 · ${dateStr}</div>
      ${moodText ? `<div class="share-meta" style="margin-top: 4px;">${moodText}</div>` : ''}
    </div>

    <div class="share-actions">
      <button class="share-action-btn" onclick="copyInsight(\`${escapeForJs(insightText)}\`)">
        📋 复制文字
      </button>
      <button class="share-action-btn primary-action" onclick="downloadShareImage('${entry.id}')">
        🖼 保存图片
      </button>
    </div>
  `;

  document.getElementById('share-modal').classList.add('active');
}

function closeShare() {
  document.getElementById('share-modal').classList.remove('active');
}

function copyInsight(text) {
  const shareText = `${text}\n\n—— 禅心 · 冥想日记`;
  navigator.clipboard.writeText(shareText).then(() => {
    showToast('已复制到剪贴板');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = shareText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已复制到剪贴板');
  });
}

function downloadShareImage(id) {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === id);
  if (!entry) return;

  const type = ALL_TYPES.find(t => t.id === entry.type) || ALL_TYPES[0];
  const moodBefore = formatMoodDisplay(entry.moodBefore);
  const moodAfter = formatMoodDisplay(entry.moodAfter);

  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');
  const W = 600, H = 800;

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#2a2a27');
  bgGrad.addColorStop(1, '#1a1a18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.beginPath();
  ctx.arc(300, 280, 180, 0, Math.PI * 2);
  const circGrad = ctx.createRadialGradient(300, 280, 0, 300, 280, 180);
  circGrad.addColorStop(0, 'rgba(201,169,110,0.08)');
  circGrad.addColorStop(1, 'rgba(201,169,110,0)');
  ctx.fillStyle = circGrad;
  ctx.fill();

  ctx.fillStyle = '#c9a96e';
  ctx.font = '18px serif';
  ctx.textAlign = 'center';
  ctx.fillText('禅心 · 冥想日记', 300, 80);

  ctx.strokeStyle = 'rgba(201,169,110,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(200, 100);
  ctx.lineTo(400, 100);
  ctx.stroke();

  const insight = entry.insight || '在宁静中遇见自己';
  ctx.fillStyle = '#e8e4dc';
  ctx.font = '22px serif';
  ctx.textAlign = 'center';

  const lines = wrapText(ctx, insight, 420);
  let y = 260;
  lines.forEach(line => {
    ctx.fillText(line, 300, y);
    y += 38;
  });

  ctx.fillStyle = '#a8a498';
  ctx.font = '15px serif';
  ctx.fillText(`${type.name} · ${entry.duration}分钟`, 300, H - 160);

  ctx.fillStyle = '#706e66';
  ctx.font = '14px serif';
  ctx.fillText(formatDate(entry.date), 300, H - 130);

  if (moodBefore && moodAfter) {
    ctx.fillStyle = '#a8a498';
    ctx.font = '15px serif';
    ctx.fillText(`${moodBefore.icon} ${moodBefore.name} → ${moodAfter.icon} ${moodAfter.name}`, 300, H - 100);
  } else if (moodAfter) {
    ctx.fillStyle = '#a8a498';
    ctx.font = '15px serif';
    ctx.fillText(`${moodAfter.icon} ${moodAfter.name}`, 300, H - 100);
  }

  ctx.strokeStyle = 'rgba(201,169,110,0.2)';
  ctx.beginPath();
  ctx.moveTo(200, H - 60);
  ctx.lineTo(400, H - 60);
  ctx.stroke();

  const link = document.createElement('a');
  link.download = `禅心冥想_${formatDate(entry.date).replace(/\s/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();

  showToast('图片已保存');
}

// ===== Close modals on overlay click =====
document.addEventListener('DOMContentLoaded', () => {
  renderJournal();

  document.getElementById('detail-modal').addEventListener('click', function(e) {
    if (e.target === this) closeDetail();
  });

  document.getElementById('share-modal').addEventListener('click', function(e) {
    if (e.target === this) closeShare();
  });
});
