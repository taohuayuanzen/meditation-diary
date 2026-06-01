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
};

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  const session = loadSession();
  if (!session || !session.type || !session.duration) {
    // No valid session, go back to setup
    window.location.href = 'meditate.html';
    return;
  }

  timerState.type = session.type;
  timerState.duration = session.duration;
  timerState.sound = session.sound || 'yinching';
  timerState.startTime = session.startTime || Date.now();
  timerState.elapsed = session.elapsed || 0;

  // If resuming from a paused state
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

  // Restore pause button state if resuming
  if (timerState.paused) {
    document.getElementById('pause-btn').textContent = '▶';
    document.getElementById('breath-hint').classList.remove('visible');
  }
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

    // Persist session every 10 seconds
    if (timerState.elapsed % 10 === 0) {
      saveSession({
        type: timerState.type,
        duration: timerState.duration,
        sound: timerState.sound,
        startTime: timerState.startTime,
        elapsed: timerState.elapsed,
        paused: false,
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

function togglePause() {
  timerState.paused = !timerState.paused;
  const btn = document.getElementById('pause-btn');

  if (timerState.paused) {
    btn.textContent = '▶';
    timerState.pauseTime = Date.now();
    document.getElementById('breath-hint').classList.remove('visible');
    // Persist paused state
    saveSession({
      type: timerState.type,
      duration: timerState.duration,
      sound: timerState.sound,
      startTime: timerState.startTime,
      elapsed: timerState.elapsed,
      paused: true,
      pauseTime: timerState.pauseTime,
    });
  } else {
    btn.textContent = '❚❚';
    timerState.startTime += (Date.now() - timerState.pauseTime);
    document.getElementById('breath-hint').classList.add('visible');
    startBreathGuide();
    // Persist resumed state
    saveSession({
      type: timerState.type,
      duration: timerState.duration,
      sound: timerState.sound,
      startTime: timerState.startTime,
      elapsed: timerState.elapsed,
      paused: false,
    });
  }
}

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

function finishMeditation() {
  clearInterval(timerState.timerInterval);
  clearInterval(timerState.breathInterval);
  timerState.running = false;

  // Play end sound
  playEndSound(timerState.sound);

  const minutes = Math.max(1, Math.round(timerState.elapsed / 60));

  // Navigate to reflection page
  saveSession({
    type: timerState.type,
    duration: timerState.duration,
    sound: timerState.sound,
    elapsed: timerState.elapsed,
    minutes: minutes,
  });

  window.location.href = 'reflection.html';
}
