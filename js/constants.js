// ===== Data Constants =====
const MOODS = [
  { id: 'calm', icon: '😌', name: '平静' },
  { id: 'anxious', icon: '😰', name: '焦虑' },
  { id: 'happy', icon: '😊', name: '喜悦' },
  { id: 'sad', icon: '😢', name: '忧伤' },
  { id: 'tired', icon: '😴', name: '疲倦' },
  { id: 'angry', icon: '😤', name: '烦躁' },
];

// ===== Full Type Pool (20 items) =====
const ALL_TYPES = [
  { id: 'breath',      icon: '🌬', name: '观呼吸',      badge: 'badge-breath' },
  { id: 'loving',      icon: '💗', name: '慈心禅',      badge: 'badge-loving' },
  { id: 'buddha',      icon: '🙏', name: '佛随念',      badge: 'badge-focus' },
  { id: 'body',        icon: '🧘', name: '身至念',      badge: 'badge-body' },
  { id: 'death',       icon: '💀', name: '死随念',      badge: 'badge-focus' },
  { id: 'vipassana',   icon: '👁', name: '毗婆舍那',    badge: 'badge-breath' },
  { id: 'walking',     icon: '🚶', name: '行禅',        badge: 'badge-body' },
  { id: 'anapanasati', icon: '🫁', name: '安那般那念',  badge: 'badge-breath' },
  { id: 'metta',       icon: '🌸', name: '慈心修习',    badge: 'badge-loving' },
  { id: 'karuna',      icon: '💧', name: '悲心修习',    badge: 'badge-loving' },
  { id: 'mudita',      icon: '🌻', name: '喜心修习',    badge: 'badge-loving' },
  { id: 'upekkha',     icon: '⚖️', name: '舍心修习',   badge: 'badge-focus' },
  { id: 'four_basis',  icon: '☸️', name: '四念处',     badge: 'badge-focus' },
  { id: 'zen',         icon: '☯️', name: '坐禅',       badge: 'badge-body' },
  { id: 'koan',        icon: '❓', name: '公案参究',    badge: 'badge-focus' },
  { id: 'mantra',      icon: '📿', name: '持咒',        badge: 'badge-breath' },
  { id: 'visualization',icon:'🌅',name: '观想',        badge: 'badge-loving' },
  { id: 'tai_chi',     icon: '🥋', name: '太极',        badge: 'badge-body' },
  { id: 'qigong',      icon: '💨', name: '气功',        badge: 'badge-body' },
  { id: 'yoga_nidra',  icon: '🌙', name: '瑜伽休息术',  badge: 'badge-body' },
];

// Default enabled type IDs (first 7)
const DEFAULT_TYPE_IDS = ['breath','loving','buddha','body','death','vipassana','walking'];

const DURATIONS = [
  { min: 5, label: '5', sub: '初学' },
  { min: 10, label: '10', sub: '日常' },
  { min: 15, label: '15', sub: '进阶' },
  { min: 30, label: '30', sub: '深入' },
  { min: 45, label: '45', sub: '精进' },
  { min: 60, label: '60', sub: '禅定' },
];

const BREATH_PHASES = [
  { text: '吸气...', duration: 4000 },
  { text: '屏息...', duration: 4000 },
  { text: '呼气...', duration: 4000 },
  { text: '静待...', duration: 4000 },
];

const SOUNDS = [
  { id: 'muyu', name: '木鱼', icon: '🪵' },
  { id: 'yinching', name: '引磬', icon: '🔔' },
  { id: 'dingxia', name: '丁夏', icon: '✨' },
  { id: 'singing_bowl', name: '颂钵', icon: '🪣' },
];
