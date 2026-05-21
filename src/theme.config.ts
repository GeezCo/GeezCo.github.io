/**
 * 主题配置文件 - 一键更换配色
 *
 * 使用方法：
 * 1. 选择一个预设主题（themePreset）
 * 2. 或者自定义颜色（customColors）
 */

// 预设主题
export const themePresets = {
  // 默认：紫蓝色渐变
  indigo: {
    name: '紫蓝',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
    gradientFrom: 'indigo-50',
    gradientTo: 'purple-50',
    gradientFromDark: 'zinc-800',
    gradientToDark: 'zinc-900',
  },

  // 绿色清新
  green: {
    name: '清新绿',
    primary: '#10b981',
    primaryDark: '#059669',
    secondary: '#34d399',
    accent: '#f59e0b',
    gradientFrom: 'emerald-50',
    gradientTo: 'teal-50',
    gradientFromDark: 'zinc-800',
    gradientToDark: 'zinc-900',
  },

  // 红色热情
  red: {
    name: '热情红',
    primary: '#ef4444',
    primaryDark: '#dc2626',
    secondary: '#f87171',
    accent: '#f59e0b',
    gradientFrom: 'red-50',
    gradientTo: 'orange-50',
    gradientFromDark: 'zinc-800',
    gradientToDark: 'zinc-900',
  },

  // 橙色活力
  orange: {
    name: '活力橙',
    primary: '#f97316',
    primaryDark: '#ea580c',
    secondary: '#fb923c',
    accent: '#10b981',
    gradientFrom: 'orange-50',
    gradientTo: 'amber-50',
    gradientFromDark: 'zinc-800',
    gradientToDark: 'zinc-900',
  },

  // 蓝色专业
  blue: {
    name: '专业蓝',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    secondary: '#60a5fa',
    accent: '#f59e0b',
    gradientFrom: 'blue-50',
    gradientTo: 'sky-50',
    gradientFromDark: 'zinc-800',
    gradientToDark: 'zinc-900',
  },

  // 粉色柔和
  pink: {
    name: '柔和粉',
    primary: '#ec4899',
    primaryDark: '#db2777',
    secondary: '#f472b6',
    accent: '#f59e0b',
    gradientFrom: 'pink-50',
    gradientTo: 'rose-50',
    gradientFromDark: 'zinc-800',
    gradientToDark: 'zinc-900',
  },

  // 深色极简
  dark: {
    name: '极简深色',
    primary: '#a1a1aa',
    primaryDark: '#71717a',
    secondary: '#d4d4d8',
    accent: '#f59e0b',
    gradientFrom: 'zinc-100',
    gradientTo: 'zinc-200',
    gradientFromDark: 'zinc-900',
    gradientToDark: 'zinc-950',
  },
};

// 当前使用的主题（修改这里即可切换）
export const currentTheme = themePresets.indigo;

// 自定义颜色（如果不想用预设，可以在这里自定义）
export const customColors = {
  // 启用自定义颜色时，设置为 true
  enabled: false,

  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
};