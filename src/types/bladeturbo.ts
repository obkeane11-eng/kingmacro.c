export type ActivationMode = 'toggle' | 'hold' | 'burst';
export type ProfileIcon = 'flame' | 'star' | 'bolt' | 'shield' | 'crosshair' | 'layers';
export type AppTheme = 'graphite' | 'carbon' | 'stealth' | 'light';
export type SoundPack = 'soft' | 'mechanical' | 'arcade';
export type HudPosition = 'tl' | 'tc' | 'tr' | 'bl' | 'br';
export type AppPage = 'dashboard' | 'profiles' | 'overlay' | 'stats' | 'discord' | 'settings';

export interface DiscordInviteInfo {
  code: string;
  inviteUrl: string;
  guildId: string;
  guildName: string;
  channelName: string;
  memberCount: number | null;
  onlineCount: number | null;
  inviterName: string;
  iconUrl: string | null;
}

export type MacroAction =
  | {
      id: string;
      kind: 'key';
      vk: number;
      label: string;
      enabled: boolean;
    }
  | {
      id: string;
      kind: 'mouse';
      button: 'left' | 'right' | 'middle';
      enabled: boolean;
    };

export interface HotkeyBinding {
  vk: number;
  label: string;
}

export interface MacroProfile {
  id: string;
  name: string;
  icon: ProfileIcon;
  actions: MacroAction[];
  cps: number;
  unlimited: boolean;
  holdMs: number;
  mode: ActivationMode;
  burstCount: number;
  hotkey: HotkeyBinding;
}

export interface HudConfig {
  enabled: boolean;
  onlyRoblox: boolean;
  scale: number;
  opacity: number;
  modules: {
    watermark: {
      on: boolean;
      pos: HudPosition;
      text: string;
      clock: boolean;
      version: boolean;
      fps: boolean;
      ping: boolean;
    };
    status: { on: boolean; pos: HudPosition };
    profiles: { on: boolean; pos: HudPosition };
    stats: { on: boolean; pos: HudPosition };
    keys: { on: boolean; pos: HudPosition };
    graph: { on: boolean; pos: HudPosition };
    crosshair: { on: boolean; pos: HudPosition };
  };
}

export interface DemoStats {
  today: number;
  all: number;
  clashes: number;
  peak: number;
  runMs: number;
  longestMs: number;
  benchRuns: number;
  week: number[];
}

export interface AppSettings {
  appName: string;
  discordInviteUrl: string;
  discordWebhookUrl: string;
  robloxOnly: boolean;
  closeToTray: boolean;
  autostart: boolean;
  delayS: number;
  soundEnabled: boolean;
  soundPack: SoundPack;
  soundVolume: number;
  theme: AppTheme;
  accent: string;
}

export const SITE_DOMAIN = 'kinglock113.cc';
export const SITE_URL = 'https://kinglock113.cc';
export const DISCORD_INVITE_URL = 'https://discord.gg/xZA6HzdXT';
export const DISCORD_INVITE_CODE = 'xZA6HzdXT';

export const ACCENT_SWATCHES = [
  { color: '#ff5a1f', label: 'Blade Orange' },
  { color: '#ff3b5c', label: 'Crimson' },
  { color: '#2ee59d', label: 'Mint' },
  { color: '#3d8bff', label: 'Cobalt' },
  { color: '#ffd21f', label: 'Amber' },
  { color: '#e6e6e6', label: 'Silver' },
];

export const THEME_PALETTES: Record<
  AppTheme,
  {
    bg: string;
    sidebar: string;
    card: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    faint: string;
    isLight: boolean;
  }
> = {
  graphite: {
    bg: '#131316',
    sidebar: '#101012',
    card: '#1a1a1f',
    surface: '#222228',
    border: 'rgba(255,255,255,0.08)',
    text: '#ededee',
    muted: '#a0a0a8',
    faint: '#6b6b73',
    isLight: false,
  },
  carbon: {
    bg: '#0c0c0d',
    sidebar: '#080809',
    card: '#131315',
    surface: '#1b1b1e',
    border: 'rgba(255,255,255,0.08)',
    text: '#f2f2f3',
    muted: '#9b9ba3',
    faint: '#63636b',
    isLight: false,
  },
  stealth: {
    bg: '#101318',
    sidebar: '#0c0e12',
    card: '#161a21',
    surface: '#1d222b',
    border: 'rgba(255,255,255,0.08)',
    text: '#e8edf5',
    muted: '#94a0b2',
    faint: '#5e6a7c',
    isLight: false,
  },
  light: {
    bg: '#f4f4f6',
    sidebar: '#ececef',
    card: '#ffffff',
    surface: '#e5e5ea',
    border: 'rgba(0,0,0,0.09)',
    text: '#141417',
    muted: '#55555e',
    faint: '#868690',
    isLight: true,
  },
};

export const MODE_DESCRIPTIONS: Record<ActivationMode, string> = {
  toggle: 'Press the hotkey to start, press again to stop.',
  hold: 'Spams only while you hold the hotkey. Built for clashes.',
  burst: 'Each hotkey press fires a fixed number of cycles, then stops.',
};

export const DEFAULT_PROFILES: MacroProfile[] = [
  {
    id: 'clash',
    name: 'Clash',
    icon: 'flame',
    actions: [{ id: 'a1', kind: 'key', vk: 0x46, label: 'F', enabled: true }],
    cps: 240,
    unlimited: false,
    holdMs: 1,
    mode: 'hold',
    burstCount: 10,
    hotkey: { vk: 0x06, label: 'Mouse 5' },
  },
  {
    id: 'sof',
    name: 'Slashes of Fury',
    icon: 'star',
    actions: [{ id: 'a2', kind: 'mouse', button: 'left', enabled: true }],
    cps: 40,
    unlimited: false,
    holdMs: 5,
    mode: 'burst',
    burstCount: 35,
    hotkey: { vk: 0x04, label: 'Mouse 3' },
  },
  {
    id: 'autoclick',
    name: 'Auto Click',
    icon: 'bolt',
    actions: [{ id: 'a3', kind: 'mouse', button: 'left', enabled: true }],
    cps: 60,
    unlimited: false,
    holdMs: 1,
    mode: 'hold',
    burstCount: 10,
    hotkey: { vk: 0x05, label: 'Mouse 4' },
  },
];

export const DEFAULT_HUD: HudConfig = {
  enabled: true,
  onlyRoblox: true,
  scale: 100,
  opacity: 85,
  modules: {
    watermark: {
      on: true,
      pos: 'tl',
      text: 'kinglock113.cc',
      clock: true,
      version: true,
      fps: false,
      ping: true,
    },
    status: { on: true, pos: 'tl' },
    profiles: { on: true, pos: 'tr' },
    stats: { on: true, pos: 'tr' },
    keys: { on: true, pos: 'bl' },
    graph: { on: false, pos: 'bl' },
    crosshair: { on: true, pos: 'tc' },
  },
};

export const DEFAULT_STATS: DemoStats = {
  today: 38420,
  all: 142890,
  clashes: 87,
  peak: 242,
  runMs: 252000,
  longestMs: 184000,
  benchRuns: 1,
  week: [14200, 29800, 19400, 44100, 31600, 52300, 38420],
};

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'kinglock113.cc',
  discordInviteUrl: DISCORD_INVITE_URL,
  discordWebhookUrl: '',
  robloxOnly: true,
  closeToTray: true,
  autostart: false,
  delayS: 0,
  soundEnabled: true,
  soundPack: 'mechanical',
  soundVolume: 60,
  theme: 'graphite',
  accent: '#ff5a1f',
};

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  test: (stats: DemoStats, profileCount: number) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', name: 'First Run', desc: 'Send your first input', test: (s) => s.all > 0 },
  { id: 'k100', name: '100K', desc: '100,000 inputs logged', test: (s) => s.all >= 100_000 },
  { id: 'm1', name: 'Millionaire', desc: '1M total inputs', test: (s) => s.all >= 1_000_000 },
  { id: 'm10', name: '10M Club', desc: '10M total inputs', test: (s) => s.all >= 10_000_000 },
  { id: 'clash', name: 'Clash King', desc: '100 clashes completed', test: (s) => s.clashes >= 100 },
  { id: 'speed', name: 'Speed Demon', desc: 'Peak 1,000+ inputs/s', test: (s) => s.peak >= 1000 },
  { id: 'marathon', name: 'Marathon', desc: '1h cumulative run time', test: (s) => s.runMs >= 3_600_000 },
  { id: 'bench', name: 'Benchmarked', desc: 'Run the PC benchmark', test: (s) => s.benchRuns > 0 },
  { id: 'collector', name: 'Collector', desc: '5+ custom profiles', test: (_s, count) => count >= 5 },
];
