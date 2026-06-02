// ===== Data Constants =====

// Legacy flat mood list (kept for backward-compatible data migration)
const MOODS = [
  { id: 'calm', icon: '😌', name: '平静' },
  { id: 'anxious', icon: '😰', name: '焦虑' },
  { id: 'happy', icon: '😊', name: '喜悦' },
  { id: 'sad', icon: '😢', name: '忧伤' },
  { id: 'tired', icon: '😴', name: '疲倦' },
  { id: 'angry', icon: '😤', name: '烦躁' },
];

// Old mood id → new category id mapping
const MOOD_LEGACY_MAP = {
  angry: 'very_unpleasant',
  anxious: 'unpleasant',
  sad: 'unpleasant',
  tired: 'unpleasant',
  calm: 'neutral',
  happy: 'pleasant',
};

// Two-tier mood system: Category → Feelings
const MOOD_CATEGORIES = [
  {
    id: 'very_unpleasant',
    name: '非常不愉快',
    icon: '😞',
    level: 1,
    feelings: ['愤怒','憎恨','嫉妒','绝望','烦躁','恐惧','痛苦','精疲力尽','羞耻','内疚','沮丧','恐慌'],
  },
  {
    id: 'unpleasant',
    name: '不愉快',
    icon: '😔',
    level: 2,
    feelings: ['焦虑','紧张','厌烦','不满','失落','担心','忧虑','气恼','委屈','疲倦','自卑'],
  },
  {
    id: 'neutral',
    name: '不悲不喜',
    icon: '😌',
    level: 3,
    feelings: ['宁静','平和','放松','清明','满足','无所谓'],
  },
  {
    id: 'pleasant',
    name: '有点愉快',
    icon: '😊',
    level: 4,
    feelings: ['愉悦','舒畅','喜悦','感恩','满足','舒适','安心','欢喜','慈爱'],
  },
  {
    id: 'very_pleasant',
    name: '非常愉快',
    icon: '😄',
    level: 5,
    feelings: ['快乐','幸福','兴奋','激动','喜悦','开心','平静','满足','轻安'],
  },
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
  { id: 'vibrate', name: '震动', icon: '📳' },
];

// ===== Wisdom Quotes from Meditation Masters =====
const WISDOM_QUOTES = [
  // 卡巴金 (Jon Kabat-Zinn)
  { author: '乔·卡巴金', title: '正念减压之父', quote: '你无法平息海浪，但你可以学会冲浪。' },
  { author: '乔·卡巴金', title: '正念减压之父', quote: '当下是你所拥有的一切。承认它、活在其中，是你能做的最根本的事。' },
  { author: '乔·卡巴金', title: '正念减压之父', quote: '正念意味着以一种特殊的方式专注：有意识地、不加评判地专注于当下。' },
  { author: '乔·卡巴金', title: '正念减压之父', quote: '你不需要去任何地方，不需要去寻觅什么。只需停下脚步，全然地在这里。' },
  { author: '乔·卡巴金', title: '正念减压之父', quote: '呼吸是连接生命与意识的桥梁，它将你的身体与心灵统一起来。' },

  // 杰克·康菲尔德 (Jack Kornfield)
  { author: '杰克·康菲尔德', title: '内观禅修导师', quote: '心的本质是清澈的。乌云会来也会走，但天空始终在那里。' },
  { author: '杰克·康菲尔德', title: '内观禅修导师', quote: '宽恕不是改变过去，而是释放对过去的执着，让未来得以自由。' },
  { author: '杰克·康菲尔德', title: '内观禅修导师', quote: '在寂静中，灵魂能找到比言语更丰富的表达。' },
  { author: '杰克·康菲尔德', title: '内观禅修导师', quote: '真正的修行不是逃避痛苦，而是学会以慈悲之心与痛苦共处。' },
  { author: '杰克·康菲尔德', title: '内观禅修导师', quote: '每一刻都是新的开始。你所需要的只是愿意重新开始。' },

  // 一行禅师 (Thich Nhat Hanh)
  { author: '一行禅师', title: '梅村创始人', quote: '呼吸时，觉知你在呼吸；走路时，觉知你在走路。这便是修行。' },
  { author: '一行禅师', title: '梅村创始人', quote: '当下最幸福。如果你懂得安住当下，你便拥有了整个宇宙。' },
  { author: '一行禅师', title: '梅村创始人', quote: '你的喜悦就是你的微笑，你的微笑就是你的喜悦。' },
  { author: '一行禅师', title: '梅村创始人', quote: '因为理解，所以慈悲。理解是爱的另一个名字。' },
  { author: '一行禅师', title: '梅村创始人', quote: '我们需要的不是更多的金钱或更大的权力，我们需要的是正念与自由。' },
  { author: '一行禅师', title: '梅村创始人', quote: '静坐不是为了变成另一个人，而是为了认出自己本来的面目。' },

  // 圣严法师 (Sheng Yen)
  { author: '圣严法师', title: '法鼓山创办人', quote: '面对它、接受它、处理它、放下它。' },
  { author: '圣严法师', title: '法鼓山创办人', quote: '需要的不多，想要的太多。' },
  { author: '圣严法师', title: '法鼓山创办人', quote: '心随境转则苦，境随心转则乐。' },
  { author: '圣严法师', title: '法鼓山创办人', quote: '少欲知足，知足常乐。这不是消极，而是智慧。' },
  { author: '圣严法师', title: '法鼓山创办人', quote: '禅不在坐，亦不在卧。禅在生活中的每一个当下。' },

  // 克里希那穆提 (J. Krishnamurti)
  { author: '克里希那穆提', title: '心灵导师', quote: '观察而不评价，是人类智慧的最高形式。' },
  { author: '克里希那穆提', title: '心灵导师', quote: '自由不是摆脱什么东西，而是理解自己。' },
  { author: '克里希那穆提', title: '心灵导师', quote: '当你不再比较时，你才能真正看见。' },
  { author: '克里希那穆提', title: '心灵导师', quote: '寂静不是没有声音，而是心不再追寻。' },
  { author: '克里希那穆提', title: '心灵导师', quote: '只有在完全的空无之中，新的事物才可能诞生。' },
  { author: '克里希那穆提', title: '心灵导师', quote: '了解你自己，就是整个世界的转变。' },
];
