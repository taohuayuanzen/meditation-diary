// ===== Timer Page (Immersive, no nav) =====

let timerState = {
  type: null,
  duration: 0,
  sound: 'yinching',
  startTime: null,
  elapsed: 0,
  running: false,
  paused: false,
  pauseTime: null,
  timerInterval: null,
  breathPhase: 0,
  breathInterval: null,
  moodBefore: null,   // { category: 'neutral', feelings: ['宁静','平和'] }
};

// Mood sheet state
let moodSheetState = {
  selectedCategory: null,
  selectedFeelings: [],
  step: 1,   // 1 = category, 2 = feelings
};

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  const session = loadSession();
  if (!session || !session.type || !session.duration) {
    window.location.href = 'meditate.html';
    return;
  }

  timerState.type = session.type;
  timerState.duration = session.duration;
  timerState.sound = session.sound || 'yinching';
  timerState.startTime = session.startTime || Date.now();
  timerState.elapsed = session.elapsed || 0;
  timerState.moodBefore = session.moodBefore || null;

  if (session.paused && session.pauseTime) {
    timerState.paused = true;
    timerState.pauseTime = session.pauseTime;
    timerState.startTime = Date.now() - (session.elapsed * 1000);
  } else if (session.startTime && session.elapsed === 0) {
    timerState.startTime = Date.now();
  } else {
    timerState.startTime = Date.now() - (timerState.elapsed * 1000);
  }

  initTimerUI();
  startTimer();
});

// ===== Timer UI =====
function initTimerUI() {
  const type = ALL_TYPES.find(t => t.id === timerState.type);
  document.getElementById('timer-type-label').textContent = type ? type.name : '冥想';
  document.getElementById('timer-time').textContent = formatTime(timerState.duration * 60);

  const progress = document.getElementById('timer-progress');
  progress.style.strokeDashoffset = '0';

  // Initial state
  updateFinishBtn(false);
  updateCancelBtn();
  updateMoodBtn();

  if (timerState.paused) {
    document.getElementById('pause-btn').textContent = '▶';
    document.getElementById('breath-hint').classList.remove('visible');
    updateFinishBtn(true);
  }

  // If mood was already selected, show it on the button
  updateMoodBtnDisplay();
}

function startTimer() {
  timerState.running = true;
  startTimerCountdown();
  if (!timerState.paused) {
    startBreathGuide();
  }
}

function startTimerCountdown() {
  clearInterval(timerState.timerInterval);

  const totalSeconds = timerState.duration * 60;
  const circumference = 2 * Math.PI * 120;

  timerState.timerInterval = setInterval(() => {
    if (!timerState.running || timerState.paused) return;

    timerState.elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
    const remaining = Math.max(0, totalSeconds - timerState.elapsed);

    document.getElementById('timer-time').textContent = formatTime(remaining);

    const progress = document.getElementById('timer-progress');
    const offset = (timerState.elapsed / totalSeconds) * circumference;
    progress.style.strokeDashoffset = Math.min(offset, circumference);

    // Update button visibility based on elapsed time
    updateCancelBtn();
    updateMoodBtn();

    // Persist session every 10 seconds
    if (timerState.elapsed % 10 === 0) {
      saveSession({
        type: timerState.type,
        duration: timerState.duration,
        sound: timerState.sound,
        startTime: timerState.startTime,
        elapsed: timerState.elapsed,
        paused: false,
        moodBefore: timerState.moodBefore,
      });
    }

    if (remaining <= 0) {
      finishMeditation();
    }
  }, 1000);
}

function startBreathGuide() {
  clearInterval(timerState.breathInterval);
  timerState.breathPhase = 0;

  const hint = document.getElementById('breath-hint');
  hint.classList.add('visible');

  function cycleBreath() {
    const phase = BREATH_PHASES[timerState.breathPhase % BREATH_PHASES.length];
    hint.textContent = phase.text;
    timerState.breathPhase++;
  }

  cycleBreath();
  timerState.breathInterval = setInterval(cycleBreath, 4000);
}

// ===== Button Visibility Controls =====

function updateFinishBtn(show) {
  const btn = document.getElementById('finish-btn');
  if (show) {
    btn.classList.add('visible');
  } else {
    btn.classList.remove('visible');
  }
}

function updateCancelBtn() {
  const btn = document.getElementById('cancel-btn');
  if (timerState.elapsed >= 60) {
    btn.classList.add('hidden');
  } else {
    btn.classList.remove('hidden');
  }
}

function updateMoodBtn() {
  const btn = document.getElementById('mood-btn');
  if (timerState.elapsed >= 60) {
    btn.classList.add('hidden');
  } else {
    btn.classList.remove('hidden');
  }
}

function updateMoodBtnDisplay() {
  const btn = document.getElementById('mood-btn');
  if (timerState.moodBefore && timerState.moodBefore.category) {
    const cat = MOOD_CATEGORIES.find(c => c.id === timerState.moodBefore.category);
    if (cat) {
      btn.textContent = cat.icon;
      btn.classList.add('selected');
      return;
    }
  }
  // Legacy: if moodBefore is a string (old format)
  if (typeof timerState.moodBefore === 'string') {
    const catId = MOOD_LEGACY_MAP[timerState.moodBefore];
    if (catId) {
      const cat = MOOD_CATEGORIES.find(c => c.id === catId);
      if (cat) {
        btn.textContent = cat.icon;
        btn.classList.add('selected');
        // Upgrade to new format
        timerState.moodBefore = { category: catId, feelings: [cat.name] };
        return;
      }
    }
  }
  btn.textContent = '😌';
  btn.classList.remove('selected');
}

// ===== Two-step Mood Sheet =====

function openMoodSheet() {
  // Reset sheet state
  moodSheetState.step = 1;
  moodSheetState.selectedCategory = (timerState.moodBefore && timerState.moodBefore.category)
    ? timerState.moodBefore.category : null;
  moodSheetState.selectedFeelings = (timerState.moodBefore && timerState.moodBefore.feelings)
    ? [...timerState.moodBefore.feelings] : [];

  renderMoodStep1();

  document.getElementById('mood-sheet-overlay').classList.add('active');
}

function closeMoodSheet() {
  document.getElementById('mood-sheet-overlay').classList.remove('active');
}

function renderMoodStep1() {
  moodSheetState.step = 1;

  document.getElementById('mood-back-btn').classList.add('hidden');
  document.getElementById('mood-sheet-title').textContent = '记录此刻心情';
  document.getElementById('mood-step1').style.display = '';
  document.getElementById('mood-step2').classList.remove('active');

  const row = document.getElementById('mood-cat-row');
  row.innerHTML = MOOD_CATEGORIES.map(cat => `
    <div class="mood-cat-item${moodSheetState.selectedCategory === cat.id ? ' selected' : ''}"
         onclick="selectMoodCategory('${cat.id}')">
      <span class="mood-cat-icon">${cat.icon}</span>
      <span class="mood-cat-name">${cat.name}</span>
    </div>
  `).join('');
}

function selectMoodCategory(catId) {
  moodSheetState.selectedCategory = catId;
  moodSheetState.selectedFeelings = [];
  renderMoodStep2();
}

function renderMoodStep2() {
  moodSheetState.step = 2;

  const cat = MOOD_CATEGORIES.find(c => c.id === moodSheetState.selectedCategory);
  if (!cat) return;

  document.getElementById('mood-back-btn').classList.remove('hidden');
  document.getElementById('mood-sheet-title').textContent = cat.name;
  document.getElementById('mood-step1').style.display = 'none';
  document.getElementById('mood-step2').classList.add('active');

  document.getElementById('mood-feelings-label').textContent = '选择你的感受（可多选）';

  const grid = document.getElementById('mood-feelings-grid');
  grid.innerHTML = cat.feelings.map(f => `
    <div class="mood-feeling-chip${moodSheetState.selectedFeelings.includes(f) ? ' selected' : ''}"
         onclick="toggleFeeling('${f}')">${f}</div>
  `).join('');

  updateMoodConfirmBtn();
}

function toggleFeeling(feeling) {
  const idx = moodSheetState.selectedFeelings.indexOf(feeling);
  if (idx >= 0) {
    moodSheetState.selectedFeelings.splice(idx, 1);
  } else {
    moodSheetState.selectedFeelings.push(feeling);
  }

  // Update chip visuals
  const chips = document.querySelectorAll('#mood-feelings-grid .mood-feeling-chip');
  chips.forEach(chip => {
    if (chip.textContent === feeling) {
      chip.classList.toggle('selected', moodSheetState.selectedFeelings.includes(feeling));
    }
  });

  updateMoodConfirmBtn();
}

function updateMoodConfirmBtn() {
  const btn = document.getElementById('mood-confirm-btn');
  btn.disabled = moodSheetState.selectedFeelings.length === 0;
}

function moodSheetBack() {
  renderMoodStep1();
}

function confirmMoodSelection() {
  if (!moodSheetState.selectedCategory || moodSheetState.selectedFeelings.length === 0) return;

  timerState.moodBefore = {
    category: moodSheetState.selectedCategory,
    feelings: [...moodSheetState.selectedFeelings],
  };

  // Update button appearance
  updateMoodBtnDisplay();

  // Persist mood to session
  saveSession({
    type: timerState.type,
    duration: timerState.duration,
    sound: timerState.sound,
    startTime: timerState.startTime,
    elapsed: timerState.elapsed,
    paused: timerState.paused,
    moodBefore: timerState.moodBefore,
  });

  closeMoodSheet();
}

// ===== Pause / Resume =====
function togglePause() {
  timerState.paused = !timerState.paused;
  const btn = document.getElementById('pause-btn');

  if (timerState.paused) {
    btn.textContent = '▶';
    timerState.pauseTime = Date.now();
    document.getElementById('breath-hint').classList.remove('visible');
    updateFinishBtn(true);

    saveSession({
      type: timerState.type,
      duration: timerState.duration,
      sound: timerState.sound,
      startTime: timerState.startTime,
      elapsed: timerState.elapsed,
      paused: true,
      pauseTime: timerState.pauseTime,
      moodBefore: timerState.moodBefore,
    });
  } else {
    btn.textContent = '❚❚';
    timerState.startTime += (Date.now() - timerState.pauseTime);
    document.getElementById('breath-hint').classList.add('visible');
    startBreathGuide();
    updateFinishBtn(false);

    saveSession({
      type: timerState.type,
      duration: timerState.duration,
      sound: timerState.sound,
      startTime: timerState.startTime,
      elapsed: timerState.elapsed,
      paused: false,
      moodBefore: timerState.moodBefore,
    });
  }
}

// ===== Cancel =====
function cancelMeditation() {
  document.getElementById('confirm-modal').classList.add('active');
}

function closeConfirm() {
  document.getElementById('confirm-modal').classList.remove('active');
}

function confirmCancel() {
  clearInterval(timerState.timerInterval);
  clearInterval(timerState.breathInterval);
  timerState.running = false;
  timerState.paused = false;
  clearSession();
  document.getElementById('confirm-modal').classList.remove('active');
  window.location.href = 'meditate.html';
}

// ===== Finish =====
function finishMeditation() {
  clearInterval(timerState.timerInterval);
  clearInterval(timerState.breathInterval);
  timerState.running = false;

  updateFinishBtn(false);

  // Play end sound
  playEndSound(timerState.sound);

  const minutes = Math.max(1, Math.round(timerState.elapsed / 60));

  // Save session data for reflection page
  saveSession({
    type: timerState.type,
    duration: timerState.duration,
    sound: timerState.sound,
    elapsed: timerState.elapsed,
    minutes: minutes,
    moodBefore: timerState.moodBefore,
  });

  // Delay navigation so the end sound has time to play
  const delay = timerState.sound === 'vibrate' ? 800 : 2000;
  setTimeout(() => {
    window.location.href = 'reflection.html';
  }, delay);
}
