// ===== Meditate Setup Page =====

const MAX_VISIBLE_TYPES = 5;

let medState = {
  selectedType: null,
  selectedDuration: null,   // null or number (minutes)
  isCustomDuration: false,  // true when user picked custom
  customDurValue: 20,       // current slider value
  selectedSound: null,
};

// ===== Init state from last setup or defaults =====
function initMedState() {
  const last = getLastSetup();
  const activeTypes = getActiveTypes();
  const firstTypeId = activeTypes.length > 0 ? activeTypes[0].id : null;
  const enabledDurMins = getEnabledDurations();

  if (last) {
    // 练习过的用户：恢复上次选择
    // 校验 type 是否仍在启用列表中
    const typeValid = last.type && activeTypes.find(t => t.id === last.type);
    medState.selectedType = typeValid ? last.type : firstTypeId;
    // 校验 duration 是否仍在偏好列表中（非自定义时）
    if (last.isCustomDuration) {
      medState.selectedDuration = last.duration || 20;
      medState.isCustomDuration = true;
    } else if (last.duration && enabledDurMins.includes(last.duration)) {
      medState.selectedDuration = last.duration;
      medState.isCustomDuration = false;
    } else {
      // 时长不在偏好中，降级为偏好第一个
      medState.selectedDuration = enabledDurMins[0] || 10;
      medState.isCustomDuration = false;
    }
    medState.selectedSound = last.sound || SOUNDS[0].id;
  } else {
    // 新用户：选中第1项
    medState.selectedType = firstTypeId;
    medState.selectedDuration = enabledDurMins[0] || 10;
    medState.isCustomDuration = false;
    medState.selectedSound = SOUNDS[0].id;
  }
}

// ===== Setup Screen =====
function getActiveTypes() {
  return getEnabledTypes();
}

function renderSetup() {
  renderTypeSection();
  renderDurationSection();
  renderSoundSection();
  checkBeginReady();
}

// ===== Type Section =====
function renderTypeSection() {
  const activeTypes = getActiveTypes();
  const typeScroll = document.getElementById('type-scroll');
  const visibleTypes = activeTypes.slice(0, MAX_VISIBLE_TYPES);
  const hasMore = activeTypes.length > MAX_VISIBLE_TYPES;

  let html = '';
  // If selected type is not in visible list, show it as the first item
  if (medState.selectedType && !visibleTypes.find(t => t.id === medState.selectedType)) {
    const sel = activeTypes.find(t => t.id === medState.selectedType);
    if (sel) {
      html += `
        <div class="type-option selected" onclick="selectType('${sel.id}')">
          <span class="type-icon">${sel.icon}</span>
          <span class="type-name">${sel.name}</span>
        </div>
      `;
      // Show remaining from visibleTypes, minus the last one to make room for selected
      const rest = visibleTypes.slice(0, MAX_VISIBLE_TYPES - 1);
      html += rest.map(t => `
        <div class="type-option${medState.selectedType === t.id ? ' selected' : ''}"
             onclick="selectType('${t.id}')">
          <span class="type-icon">${t.icon}</span>
          <span class="type-name">${t.name}</span>
        </div>
      `).join('');
    } else {
      html = visibleTypes.map(t => `
        <div class="type-option${medState.selectedType === t.id ? ' selected' : ''}"
             onclick="selectType('${t.id}')">
          <span class="type-icon">${t.icon}</span>
          <span class="type-name">${t.name}</span>
        </div>
      `).join('');
    }
  } else {
    html = visibleTypes.map(t => `
      <div class="type-option${medState.selectedType === t.id ? ' selected' : ''}"
           onclick="selectType('${t.id}')">
        <span class="type-icon">${t.icon}</span>
        <span class="type-name">${t.name}</span>
      </div>
    `).join('');
  }

  if (hasMore) {
    html += `
      <div class="type-more-btn" onclick="openTypeSheet()">
        <span class="type-more-icon">⋯</span>
        <span class="type-more-text">更多</span>
      </div>
    `;
  }

  typeScroll.innerHTML = html;
}

function selectType(id) {
  medState.selectedType = medState.selectedType === id ? null : id;
  renderSetup();
}

// ===== Type Sheet =====
function openTypeSheet() {
  const activeTypes = getActiveTypes();
  const list = document.getElementById('type-picker-list');
  list.innerHTML = activeTypes.map(t => `
    <div class="type-picker-item${medState.selectedType === t.id ? ' selected' : ''}"
         onclick="selectTypeInSheet('${t.id}')">
      <span class="type-picker-icon">${t.icon}</span>
      <span class="type-picker-name">${t.name}</span>
    </div>
  `).join('');

  document.getElementById('type-sheet-overlay').classList.add('active');
}

function closeTypeSheet() {
  document.getElementById('type-sheet-overlay').classList.remove('active');
}

function selectTypeInSheet(id) {
  medState.selectedType = medState.selectedType === id ? null : id;
  closeTypeSheet();
  renderSetup();
}

// ===== Duration Section =====
function renderDurationSection() {
  const enabledDurs = getEnabledDurationOptions();
  const durPresets = document.getElementById('duration-presets');
  let html = enabledDurs.map(d => `
    <div class="duration-preset${!medState.isCustomDuration && medState.selectedDuration === d.min ? ' selected' : ''}"
         onclick="selectDuration(${d.min})">
      ${d.label}<small>${d.sub}</small>
    </div>
  `).join('');

  // Custom button
  const customSelected = medState.isCustomDuration;
  const customLabel = customSelected ? medState.selectedDuration : '...';
  html += `
    <div class="duration-custom-btn${customSelected ? ' selected' : ''}"
         onclick="openDurSheet()">
      ${customLabel}<small>自定义</small>
    </div>
  `;

  durPresets.innerHTML = html;
}

function selectDuration(min) {
  medState.selectedDuration = min;
  medState.isCustomDuration = false;
  renderSetup();
}

// ===== Custom Duration Sheet =====
function openDurSheet() {
  // Pre-fill slider with current custom value or last selected
  const slider = document.getElementById('custom-dur-slider');
  const display = document.getElementById('custom-dur-value');

  if (medState.isCustomDuration && medState.selectedDuration) {
    slider.value = medState.selectedDuration;
    display.textContent = medState.selectedDuration;
    medState.customDurValue = medState.selectedDuration;
  } else {
    slider.value = medState.customDurValue || 20;
    display.textContent = slider.value;
  }

  document.getElementById('dur-sheet-overlay').classList.add('active');
}

function closeDurSheet() {
  document.getElementById('dur-sheet-overlay').classList.remove('active');
}

function onCustomDurChange(val) {
  medState.customDurValue = parseInt(val);
  document.getElementById('custom-dur-value').textContent = val;
}

function confirmCustomDur() {
  const val = parseInt(document.getElementById('custom-dur-slider').value);
  medState.selectedDuration = val;
  medState.isCustomDuration = true;
  closeDurSheet();
  renderSetup();
}

// ===== Sound Section =====
function renderSoundSection() {
  const soundScroll = document.getElementById('sound-scroll');
  soundScroll.innerHTML = SOUNDS.map(s => `
    <div class="sound-option${medState.selectedSound === s.id ? ' selected' : ''}"
         onclick="selectSound('${s.id}')">
      <button class="sound-play" onclick="event.stopPropagation(); previewSound('${s.id}')" title="试听">▶</button>
      <span class="sound-icon">${s.icon}</span>
      <span class="sound-name">${s.name}</span>
    </div>
  `).join('');
}

function selectSound(id) {
  medState.selectedSound = id;
  renderSetup();
}

function previewSound(id) {
  playEndSound(id);
}

// ===== Begin =====
function checkBeginReady() {
  const ready = medState.selectedType && medState.selectedDuration;
  document.getElementById('begin-btn').disabled = !ready;
}

function beginMeditation() {
  if (!medState.selectedType || !medState.selectedDuration) return;

  // 记住用户选择，下次打开自动恢复
  saveLastSetup({
    type: medState.selectedType,
    duration: medState.selectedDuration,
    isCustomDuration: medState.isCustomDuration,
    sound: medState.selectedSound,
  });

  saveSession({
    type: medState.selectedType,
    duration: medState.selectedDuration,
    sound: medState.selectedSound || 'yinching',
    startTime: Date.now(),
    elapsed: 0,
    paused: false,
  });

  window.location.href = 'timer.html';
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initMedState();
  renderSetup();
});
