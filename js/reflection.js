// ===== Reflection Page (Immersive, no nav) =====

let refState = {
  session: null,
  moodAfter: null,  // { category: 'pleasant', feelings: ['愉悦','感恩'] }
};

// MoodPicker instance (initialized in DOMContentLoaded)
let moodPicker;

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

  // Init MoodPicker
  moodPicker = new MoodPicker({
    overlayId: 'mood-ref-sheet-overlay',
    step1Id: 'mood-ref-step1',
    step2Id: 'mood-ref-step2',
    catRowId: 'mood-ref-cat-row',
    feelingsGridId: 'mood-ref-feelings-grid',
    backBtnId: 'mood-ref-back-btn',
    titleId: 'mood-ref-title',
    confirmBtnId: 'mood-ref-confirm-btn',
    titleLabelId: 'mood-ref-feelings-label',
    onConfirm: (category, feelings) => {
      refState.moodAfter = { category, feelings };
      updateMoodTriggerDisplay();
    }
  });

  updateMoodTriggerDisplay();

  // Auto-open mood picker if enabled
  const moodPopup = getMoodPopupSettings();
  if (moodPopup.autoAfter) {
    setTimeout(() => {
      openReflectionMoodSheet();
    }, 800);
  }
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

// ===== Mood Sheet (delegated to MoodPicker) =====

function openReflectionMoodSheet() {
  const init = refState.moodAfter;
  moodPicker.open(init?.category || null, init?.feelings || [], '记录此刻心情');
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
  window.location.href = 'journal.html';
}

function goBackToMeditate() {
  // Discard this session
  clearSession();
  window.location.href = 'meditate.html';
}
