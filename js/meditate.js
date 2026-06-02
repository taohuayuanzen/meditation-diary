// ===== Meditate Setup Page =====

const MAX_VISIBLE_TYPES = 5;

let medState = {
  selectedType: null,
  selectedDuration: null,   // null or number (minutes)
  isCustomDuration: false,  // true when user picked custom
  customDurValue: 20,       // current slider value
  selectedSound: 'yinching',
};

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
  const presets = [
    { min: 10, label: '10', sub: '分钟' },
    { min: 20, label: '20', sub: '分钟' },
    { min: 30, label: '30', sub: '分钟' },
    { min: 45, label: '45', sub: '分钟' },
    { min: 60, label: '60', sub: '分钟' },
  ];

  const durPresets = document.getElementById('duration-presets');
  let html = presets.map(d => `
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
  renderSetup();
});
