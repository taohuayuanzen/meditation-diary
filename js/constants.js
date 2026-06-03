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

// Shared SVG attributes for sound & type icons
const SVG_ATTR = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

// ===== Meditation Types (11 items) =====
const ALL_TYPES = [
  { id: 'sitting_zen',    icon: `<svg ${SVG_ATTR}><circle cx="12" cy="6" r="2.5"/><path d="M7 18c0-4 2.5-7 5-7s5 3 5 7"/><path d="M9 13h6"/><path d="M6 18h12"/></svg>`, name: '坐禅',       badge: 'badge-body' },
  { id: 'walking_zen',    icon: `<svg ${SVG_ATTR}><circle cx="12" cy="4" r="2"/><path d="M12 6v5"/><path d="M12 11l-3 7"/><path d="M12 11l3 7"/><path d="M8 20h2"/><path d="M14 20h2"/></svg>`, name: '行禅',       badge: 'badge-body' },
  { id: 'life_zen',       icon: `<svg ${SVG_ATTR}><path d="M5 15c0-4 3-7 7-7s7 3 7 7"/><path d="M7 15c0 2 2 4 5 4s5-2 5-4"/><path d="M9 8c-1-2-0.5-4 1-5"/><path d="M14 8c-1-2-0.5-4 1-5"/></svg>`, name: '生活禅',     badge: 'badge-loving' },
  { id: 'standing_stake', icon: `<svg ${SVG_ATTR}><circle cx="12" cy="5" r="2"/><path d="M12 7v8"/><path d="M7 11c0 2 2 3 5 3s5-1 5-3"/><path d="M9 20h2"/><path d="M13 20h2"/></svg>`, name: '站桩',       badge: 'badge-body' },
  { id: 'yoga',           icon: `<svg ${SVG_ATTR}><circle cx="12" cy="4" r="2"/><path d="M12 6v10"/><path d="M12 16l-4 4"/><path d="M12 12c-2 0-4 1-4 3"/><path d="M8 6c-1 2-1 5 0 7"/><path d="M16 6c1 2 1 5 0 7"/></svg>`, name: '瑜伽',       badge: 'badge-body' },
  { id: 'pranayama',      icon: `<svg ${SVG_ATTR}><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><circle cx="3" cy="12" r="0.8" fill="currentColor"/><circle cx="21" cy="12" r="0.8" fill="currentColor"/></svg>`, name: '调息',       badge: 'badge-breath' },
  { id: 'chanting',       icon: `<svg ${SVG_ATTR}><ellipse cx="6" cy="12" rx="2.5" ry="6"/><ellipse cx="18" cy="12" rx="2.5" ry="6"/><path d="M8.5 8h7"/><path d="M8.5 12h7"/><path d="M8.5 16h7"/></svg>`, name: '诵经',       badge: 'badge-focus' },
  { id: 'baduanjin',      icon: `<svg ${SVG_ATTR}><circle cx="12" cy="4" r="2"/><path d="M12 6v6"/><path d="M7 9l5 2 5-2"/><path d="M7 9l-2 4"/><path d="M17 9l2 4"/><path d="M9 20h6"/></svg>`, name: '八段锦',     badge: 'badge-body' },
  { id: 'yijinjing',      icon: `<svg ${SVG_ATTR}><circle cx="12" cy="4" r="2"/><path d="M12 6v8"/><path d="M4 10h16"/><path d="M9 20h6"/></svg>`, name: '易筋经',     badge: 'badge-body' },
  { id: 'taichi',         icon: `<svg ${SVG_ATTR}><circle cx="12" cy="12" r="9"/><path d="M12 3c-2.5 2.5-2.5 5.5 0 9s2.5 6.5 0 9"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor"/><circle cx="12" cy="16.5" r="1.2"/></svg>`, name: '太极',       badge: 'badge-body' },
  { id: 'yoga_nidra',     icon: `<svg ${SVG_ATTR}><circle cx="5" cy="14" r="2"/><path d="M7 14h8"/><path d="M15 14l3 4"/><path d="M15 14l3-2"/><path d="M17 4c1-1 3-1 4 0s1 3 0 4"/></svg>`, name: '瑜伽休息术', badge: 'badge-body' },
];

// Default enabled type IDs (first 10)
const DEFAULT_TYPE_IDS = ['sitting_zen','walking_zen','life_zen','standing_stake','yoga','pranayama','chanting','baduanjin','yijinjing','taichi'];

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
  {
    id: 'muyu', name: '木鱼',
    icon: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><g transform="translate(0.65, 4.1)"><path d="M0.03 13.72c-0.18 1.13 0.63 1.78 1.05 1.98 0.41 0.2 1.11 0 1.39 0 2.05 0.2 6.45 2.31 11.93 2.31 0 0 8.87 0.13 9.55-6.34 0.16-1.68 0.09-4.88-1.25-5.03-1.12-0.15-1.8 0.07-3.22 0.36-0.95 0.19-3.32 0.53-3.74 0.79-4.59 2.09-7.09 3.59-7.78 3.82-0.52 0-0.97-0.13-1.09-1.23 0-0.45 1.72-1.53 2.46-1.7C12 7.96 14 7.65 14.24 7.65c0.34 0 7.76-1.79 7.99-1.95 0.23-0.17 0.47-0.33 0.47-0.92 0-0.27-0.59-0.87-1.27-1.61-0.8-0.87-1.76-1.88-2.47-2.12C17.63 0.37 15.05-0.19 12.8 0.06 7.86 0.62 4.78 6.02 4.51 6.4c-1.14 1.59-2.05 3.61-2.53 4.51C1.52 11.77 0.21 12.93 0.03 13.72z"/></g></svg>`,
  },
  {
    id: 'yinching', name: '引磬',
    icon: `<svg ${SVG_ATTR}><path d="M7 18c0-5 2.5-8 5-8s5 3 5 8"/><path d="M12 10V7"/><path d="M10 7h4"/><path d="M18 13l1 4"/></svg>`,
  },
  {
    id: 'dingxia', name: '丁夏',
    icon: `<svg ${SVG_ATTR}><rect x="8" y="8" width="8" height="12" rx="1.5"/><path d="M12 5v3"/><circle cx="12" cy="4" r="1.2" fill="currentColor"/><path d="M8 14h8"/></svg>`,
  },
  {
    id: 'singing_bowl', name: '颂钵',
    icon: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><g transform="translate(0.25, 5.25)"><path d="M23.648.14c-0.31-1.86-1.35-2.94-3.22-3.34-2.29-0.5-4.6-0.75-6.94-0.82-2.47-0.08-4.950.01-7.40.37-1.190.17-2.370.4-3.510.83-0.930.35-1.550.94-1.881.9C-0.149.520.0411.931.014.31c1.092.73.044.465.885.181.630.423.280.585.010.561.570.033.16-0.144.74-0.481.54-0.333.02-0.844.17-1.992.62-2.643.46-5.822.85-9.44zM2.226.23c0.93-0.561.98-0.773.03-0.953.26-0.576.55-0.679.85-0.451.890.133.790.335.610.910.40.130.790.271.140.510.430.290.440.470.00.74-0.780.47-1.650.68-2.530.86-2.390.5-4.810.6-7.260.66-2.71-0.08-5.45-0.18-8.12-0.85-0.6-0.15-1.19-0.33-1.72-0.66-0.45-0.28-0.46-0.50.01-0.78zm15.1712.31c-3.30.93-6.651.02-9.990.26-3.64-0.83-5.57-3.31-6.28-6.97-0.06-0.3-0.13-0.6-0.07-1.01.170.872.441.153.81.040.74-0.061.48-0.112.21-0.211.0-0.141.940.022.840.451.140.542.330.83.60.710.87-0.061.7-0.272.51-0.610.53-0.221.05-0.441.58-0.671.02-0.452.04-0.513.11-0.140.740.261.510.362.26-0.03-0.013.09-2.476.32-5.567.19zm4.37-7.74c-0.35-0.05-0.7-0.14-1.04-0.24-1.13-0.34-2.23-0.28-3.310.17-0.660.27-1.310.56-1.970.82-1.640.66-3.30.71-4.91-0.07-1.48-0.72-3.0-0.73-4.57-0.52-0.990.14-1.990.28-2.990.0C1.0810.420.729.781.277.9c0.04-0.150.09-0.290.15-0.441.641.053.481.275.321.522.230.34.470.356.710.282.46-0.084.91-0.277.29-0.940.57-0.161.12-0.361.61-0.70.2-0.140.29-0.110.350.110.20.660.331.320.332.010.00.62-0.651.15-1.271.06z"/></g></svg>`,
  },
  {
    id: 'vibrate', name: '震动',
    icon: `<svg ${SVG_ATTR}><rect x="7" y="4" width="10" height="16" rx="2"/><path d="M4 9c-1 1-1 3 0 4"/><path d="M2.5 7c-1.5 2-1.5 6 0 8"/><path d="M20 9c1 1 1 3 0 4"/><path d="M21.5 7c1.5 2 1.5 6 0 8"/></svg>`,
  },
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
