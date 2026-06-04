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
  enabledTypes: ['sitting_zen','walking_zen','life_zen','standing_stake','yoga','pranayama','chanting','baduanjin','yijinjing','taichi'],
  enabledDurations: [10, 20, 30, 45, 60],  // 时长偏好（分钟）
  lastSetup: null,  // { type, duration, isCustomDuration, sound } — 上次冥想设置
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (!saved) return { ...DEFAULT_SETTINGS };
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    // Migrate: if saved enabledTypes contains stale ids not in ALL_TYPES, reset to default
    if (merged.enabledTypes && ALL_TYPES) {
      const validIds = new Set(ALL_TYPES.map(t => t.id));
      const hasStale = merged.enabledTypes.some(id => !validIds.has(id));
      if (hasStale) {
        merged.enabledTypes = DEFAULT_SETTINGS.enabledTypes;
        saveSettings(merged); // persist the fix
      }
    }
    // Migrate: if saved enabledDurations contains stale mins not in ALL_DURATIONS, reset to default
    if (merged.enabledDurations && ALL_DURATIONS) {
      const validMins = new Set(ALL_DURATIONS.map(d => d.min));
      const hasStaleDur = merged.enabledDurations.some(m => !validMins.has(m));
      if (hasStaleDur) {
        merged.enabledDurations = DEFAULT_SETTINGS.enabledDurations;
        saveSettings(merged);
      }
    }
    return merged;
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

// ===== Duration Preferences =====
function getEnabledDurations() {
  const settings = loadSettings();
  return settings.enabledDurations || DEFAULT_SETTINGS.enabledDurations;
}

function setEnabledDurations(mins) {
  const settings = loadSettings();
  settings.enabledDurations = mins;
  saveSettings(settings);
}

function getEnabledDurationOptions() {
  const mins = getEnabledDurations();
  return ALL_DURATIONS.filter(d => mins.includes(d.min));
}

// ===== Last Setup (remember user's last meditation choices) =====
function getLastSetup() {
  const settings = loadSettings();
  return settings.lastSetup || null;
}

function saveLastSetup(setup) {
  const settings = loadSettings();
  settings.lastSetup = setup;
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
