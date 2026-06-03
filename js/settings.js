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

// ===== Contact Modal =====
function openContact() {
  const overlay = document.getElementById('contact-overlay');
  if (overlay) overlay.classList.add('active');
}

function closeContact(e) {
  if (e && e.target && !e.target.classList.contains('about-overlay')) return;
  const overlay = document.getElementById('contact-overlay');
  if (overlay) overlay.classList.remove('active');
}

function copyEmail() {
  const email = document.getElementById('contact-email')?.textContent || 'zen@chanxin.app';
  copyText(email, '邮箱已复制');
}

function copyWechat() {
  const wechat = document.getElementById('contact-wechat')?.textContent || 'ChanXin_App';
  copyText(wechat, '微信号已复制');
}

// ===== Share Friend Modal =====
function openShare() {
  const overlay = document.getElementById('share-friend-overlay');
  if (overlay) overlay.classList.add('active');
  const tip = document.getElementById('share-friend-tip');
  if (tip) tip.textContent = '';
}

function closeShareFriend(e) {
  if (e && e.target && !e.target.classList.contains('about-overlay')) return;
  const overlay = document.getElementById('share-friend-overlay');
  if (overlay) overlay.classList.remove('active');
}

function copyShareLink() {
  const url = window.location.origin + window.location.pathname.replace('settings.html', 'index.html');
  const text = '推荐你一个冥想日记应用「联结」—— 纯前端、无广告、数据本地存储 🧘‍♂️ ' + url;
  copyText(text, '链接已复制，快去分享吧');
}

function shareToWechat() {
  const tip = document.getElementById('share-friend-tip');
  if (tip) {
    tip.textContent = '请复制链接后，打开微信分享给好友或朋友圈';
  }
  copyShareLink();
}

// ===== Utility =====
function copyText(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg);
  } catch {
    showToast('复制失败，请手动复制');
  }
  document.body.removeChild(ta);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderTypeToggles();
  initSettingsList();
});
