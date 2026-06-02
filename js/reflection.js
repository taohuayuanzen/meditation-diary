// ===== Reflection Page (Immersive, no nav) =====

let refState = {
  session: null,
  moodAfter: null,  // { category: 'pleasant', feelings: ['愉悦','感恩'] }
};

// Mood sheet state for reflection page
let refMoodState = {
  selectedCategory: null,
  selectedFeelings: [],
  step: 1,
};

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  const session = loadSession();
  if (!session || !session.type) {
    window.location.href = 'meditate.html';
    return;
  }

  refState.session = session;
  refState.moodAfter = null;

  document.getElementById('reflection-duration').textContent =
    `本次冥想 ${session.minutes || Math.max(1, Math.round(session.elapsed / 60))} 分钟`;
  document.getElementById('insight-text').value = '';

  updateMoodTriggerDisplay();
});

// ===== Mood Trigger Display =====
function updateMoodTriggerDisplay() {
  const trigger = document.getElementById('mood-after-trigger');
  const icon = document.getElementById('mood-trigger-icon');
  const text = document.getElementById('mood-trigger-text');

  if (refState.moodAfter && refState.moodAfter.category) {
    const cat = MOOD_CATEGORIES.find(c => c.id === refState.moodAfter.category);
    if (cat) {
      icon.textContent = cat.icon;
      const feelingsStr = refState.moodAfter.feelings.join('·');
      text.textContent = feelingsStr;
      trigger.classList.add('has-mood');
      return;
    }
  }

  icon.textContent = '😌';
  text.textContent = '点击选择心情';
  trigger.classList.remove('has-mood');
}

// ===== Two-step Mood Sheet =====

function openReflectionMoodSheet() {
  refMoodState.step = 1;
  refMoodState.selectedCategory = (refState.moodAfter && refState.moodAfter.category)
    ? refState.moodAfter.category : null;
  refMoodState.selectedFeelings = (refState.moodAfter && refState.moodAfter.feelings)
    ? [...refState.moodAfter.feelings] : [];

  renderRefMoodStep1();
  document.getElementById('mood-ref-sheet-overlay').classList.add('active');
}

function closeReflectionMoodSheet() {
  document.getElementById('mood-ref-sheet-overlay').classList.remove('active');
}

function renderRefMoodStep1() {
  refMoodState.step = 1;

  document.getElementById('mood-ref-back-btn').classList.add('hidden');
  document.getElementById('mood-ref-title').textContent = '此刻心情';
  document.getElementById('mood-ref-step1').style.display = '';
  document.getElementById('mood-ref-step2').classList.remove('active');

  const row = document.getElementById('mood-ref-cat-row');
  row.innerHTML = MOOD_CATEGORIES.map(cat => `
    <div class="mood-cat-item${refMoodState.selectedCategory === cat.id ? ' selected' : ''}"
         onclick="selectRefMoodCategory('${cat.id}')">
      <span class="mood-cat-icon">${cat.icon}</span>
      <span class="mood-cat-name">${cat.name}</span>
    </div>
  `).join('');
}

function selectRefMoodCategory(catId) {
  refMoodState.selectedCategory = catId;
  refMoodState.selectedFeelings = [];
  renderRefMoodStep2();
}

function renderRefMoodStep2() {
  refMoodState.step = 2;

  const cat = MOOD_CATEGORIES.find(c => c.id === refMoodState.selectedCategory);
  if (!cat) return;

  document.getElementById('mood-ref-back-btn').classList.remove('hidden');
  document.getElementById('mood-ref-title').textContent = cat.name;
  document.getElementById('mood-ref-step1').style.display = 'none';
  document.getElementById('mood-ref-step2').classList.add('active');

  const grid = document.getElementById('mood-ref-feelings-grid');
  grid.innerHTML = cat.feelings.map(f => `
    <div class="mood-feeling-chip${refMoodState.selectedFeelings.includes(f) ? ' selected' : ''}"
         onclick="toggleRefFeeling('${f}')">${f}</div>
  `).join('');

  updateRefMoodConfirmBtn();
}

function toggleRefFeeling(feeling) {
  const idx = refMoodState.selectedFeelings.indexOf(feeling);
  if (idx >= 0) {
    refMoodState.selectedFeelings.splice(idx, 1);
  } else {
    refMoodState.selectedFeelings.push(feeling);
  }

  const chips = document.querySelectorAll('#mood-ref-feelings-grid .mood-feeling-chip');
  chips.forEach(chip => {
    if (chip.textContent === feeling) {
      chip.classList.toggle('selected', refMoodState.selectedFeelings.includes(feeling));
    }
  });

  updateRefMoodConfirmBtn();
}

function updateRefMoodConfirmBtn() {
  document.getElementById('mood-ref-confirm-btn').disabled = refMoodState.selectedFeelings.length === 0;
}

function moodRefSheetBack() {
  renderRefMoodStep1();
}

function confirmRefMoodSelection() {
  if (!refMoodState.selectedCategory || refMoodState.selectedFeelings.length === 0) return;

  refState.moodAfter = {
    category: refMoodState.selectedCategory,
    feelings: [...refMoodState.selectedFeelings],
  };

  updateMoodTriggerDisplay();
  closeReflectionMoodSheet();
}

// ===== Save Entry =====
function saveEntry() {
  const session = refState.session;
  if (!session) return;

  const minutes = session.minutes || Math.max(1, Math.round(session.elapsed / 60));
  const insight = document.getElementById('insight-text').value.trim();

  // Normalize moodBefore (upgrade legacy string format)
  let moodBefore = session.moodBefore || null;
  if (typeof moodBefore === 'string') {
    const catId = MOOD_LEGACY_MAP[moodBefore];
    if (catId) {
      const cat = MOOD_CATEGORIES.find(c => c.id === catId);
      moodBefore = { category: catId, feelings: cat ? [cat.name] : [] };
    } else {
      moodBefore = null;
    }
  }

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
    type: session.type,
    moodBefore: moodBefore,
    moodAfter: refState.moodAfter,
    duration: minutes,
    insight: insight,
    sound: session.sound || 'yinching',
  };

  addEntry(entry);
  clearSession();
  window.location.href = 'index.html';
}

function goBackToMeditate() {
  // Discard this session
  clearSession();
  window.location.href = 'meditate.html';
}
