// ===== Settings Page Logic =====

let enabledIds = [];

function renderTypeToggles() {
  enabledIds = getEnabledTypeIds();
  const grid = document.getElementById('type-toggle-grid');
  if (!grid) return;

  grid.innerHTML = ALL_TYPES.map(t => {
    const isOn = enabledIds.includes(t.id);
    return `
      <div class="type-toggle-item${isOn ? ' on' : ''}" data-id="${t.id}" onclick="toggleType('${t.id}')">
        <span class="type-toggle-icon">${t.icon}</span>
        <span class="type-toggle-name">${t.name}</span>
        <span class="type-toggle-switch${isOn ? ' active' : ''}"></span>
      </div>
    `;
  }).join('');

  updateCount();
}

function toggleType(id) {
  const idx = enabledIds.indexOf(id);
  if (idx > -1) {
    // Check minimum
    if (enabledIds.length <= 4) {
      showToast('至少需要选择 4 项');
      return;
    }
    enabledIds.splice(idx, 1);
  } else {
    enabledIds.push(id);
  }

  // Save immediately
  setEnabledTypeIds(enabledIds);

  // Update UI
  const item = document.querySelector(`.type-toggle-item[data-id="${id}"]`);
  const sw = item?.querySelector('.type-toggle-switch');
  if (item) item.classList.toggle('on', enabledIds.includes(id));
  if (sw) sw.classList.toggle('active', enabledIds.includes(id));

  updateCount();
}

function updateCount() {
  const countEl = document.getElementById('type-count');
  if (countEl) {
    countEl.textContent = `${enabledIds.length}/${ALL_TYPES.length}`;
    countEl.classList.toggle('warn', enabledIds.length <= 4);
  }
}

// ===== Settings List Page (main settings) =====
function initSettingsList() {
  const subEl = document.getElementById('type-prefs-sub');
  if (subEl) {
    const ids = getEnabledTypeIds();
    subEl.textContent = `${ids.length}/${ALL_TYPES.length} 已启用`;
  }
}

// ===== About Modal =====
function openAbout() {
  const overlay = document.getElementById('about-overlay');
  if (overlay) {
    overlay.classList.add('active');
  }
}

function closeAbout(e) {
  // If called with event (click on overlay backdrop), only close if clicking the overlay itself
  if (e && e.target && !e.target.classList.contains('about-overlay')) return;
  const overlay = document.getElementById('about-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderTypeToggles();
  initSettingsList();
});
