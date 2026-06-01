// ===== Storage Layer =====
const STORAGE_KEY = 'zen_mind_entries';
const SETTINGS_KEY = 'zen_mind_settings';

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(entry) {
  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
}

function deleteEntry(id) {
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
}

// ===== Settings =====
const DEFAULT_SETTINGS = {
  enabledTypes: ['breath','loving','buddha','body','death','vipassana','walking'],
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (!saved) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getEnabledTypeIds() {
  const settings = loadSettings();
  return settings.enabledTypes || DEFAULT_SETTINGS.enabledTypes;
}

function setEnabledTypeIds(ids) {
  const settings = loadSettings();
  settings.enabledTypes = ids;
  saveSettings(settings);
}

function getEnabledTypes() {
  const ids = getEnabledTypeIds();
  return ALL_TYPES.filter(t => ids.includes(t.id));
}

// Backward-compatible: TYPES resolves to enabled types
const TYPES = getEnabledTypes();

// ===== Stats =====
function calcStats() {
  const entries = loadEntries();
  const total = entries.length;
  const minutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (entries.length === 0) return { total: 0, minutes: 0, streak: 0 };

  const dateSet = new Set();
  entries.forEach(e => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    dateSet.add(d.getTime());
  });

  let checkDate = today.getTime();
  while (dateSet.has(checkDate)) {
    streak++;
    checkDate -= 86400000;
  }

  return { total, minutes, streak };
}
