// ===== Reflection Page (Immersive, no nav) =====

let refState = {
  session: null,
  moodAfter: null,
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

  renderReflection();
});

// ===== Reflection =====
function renderReflection() {
  const moodGrid = document.getElementById('mood-after-grid');
  if (!moodGrid) return;

  moodGrid.innerHTML = MOODS.map(m => `
    <div class="mood-option${refState.moodAfter === m.id ? ' selected' : ''}"
         onclick="selectMoodAfter('${m.id}')">
      <span class="mood-icon">${m.icon}</span>
      <span class="mood-name">${m.name}</span>
    </div>
  `).join('');
}

function selectMoodAfter(id) {
  refState.moodAfter = refState.moodAfter === id ? null : id;
  renderReflection();
}

function saveEntry() {
  const session = refState.session;
  if (!session) return;

  const minutes = session.minutes || Math.max(1, Math.round(session.elapsed / 60));
  const insight = document.getElementById('insight-text').value.trim();

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
    type: session.type,
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
