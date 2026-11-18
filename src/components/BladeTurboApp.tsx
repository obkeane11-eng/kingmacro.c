import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bolt,
  Copy,
  Crosshair,
  Download,
  ExternalLink,
  Flame,
  Layers,
  LayoutGrid,
  Maximize2,
  MessageSquare,
  Minimize2,
  Monitor,
  Pin,
  Play,
  Plus,
  RefreshCw,
  Send,
  Settings as SettingsIcon,
  Share2,
  Shield,
  Square,
  Star,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import {
  ACHIEVEMENTS,
  ACCENT_SWATCHES,
  DEFAULT_HUD,
  DEFAULT_PROFILES,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  DISCORD_INVITE_URL,
  MODE_DESCRIPTIONS,
  THEME_PALETTES,
  type ActivationMode,
  type AppPage,
  type AppSettings,
  type AppTheme,
  type DemoStats,
  type DiscordInviteInfo,
  type HudConfig,
  type HudPosition,
  type MacroProfile,
  type ProfileIcon,
  type SoundPack,
} from '../types/bladeturbo';
import { downloadPersonalizedWindowsApp } from '../utils/downloadWindowsApp';
import { playMacroCue } from '../utils/soundFx';
import { BladeLogo } from './BladeLogo';
import {
  ACHIEVEMENT_ICONS,
  StartDialButton,
  ToggleSwitch,
  WhatsNewModal,
} from './MacroUiControls';

interface BladeTurboAppProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  discordInfo?: DiscordInviteInfo | null;
  discordLoading?: boolean;
  onRefreshDiscord?: () => void;
  onBrandChange?: (appName: string, inviteUrl: string) => void;
}

const STORAGE_KEY = 'kinglock113.cc.workspace.v1';

interface SavedWorkspace {
  profiles?: MacroProfile[];
  hud?: HudConfig;
  stats?: DemoStats;
  settings?: AppSettings;
}

function loadSavedWorkspace(): SavedWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SavedWorkspace;
  } catch {
    return {};
  }
}

function mergeHudConfig(saved?: HudConfig): HudConfig {
  if (!saved) return DEFAULT_HUD;
  return {
    ...DEFAULT_HUD,
    ...saved,
    modules: {
      watermark: { ...DEFAULT_HUD.modules.watermark, ...(saved.modules?.watermark || {}) },
      status: { ...DEFAULT_HUD.modules.status, ...(saved.modules?.status || {}) },
      profiles: { ...DEFAULT_HUD.modules.profiles, ...(saved.modules?.profiles || {}) },
      stats: { ...DEFAULT_HUD.modules.stats, ...(saved.modules?.stats || {}) },
      keys: { ...DEFAULT_HUD.modules.keys, ...(saved.modules?.keys || {}) },
      graph: { ...DEFAULT_HUD.modules.graph, ...(saved.modules?.graph || {}) },
      crosshair: { ...DEFAULT_HUD.modules.crosshair, ...(saved.modules?.crosshair || {}) },
    },
  };
}

const ICON_MAP: Record<ProfileIcon, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  flame: Flame,
  star: Star,
  bolt: Bolt,
  shield: Shield,
  crosshair: Crosshair,
  layers: Layers,
};

const POS_LABELS: { id: HudPosition; label: string }[] = [
  { id: 'tl', label: 'TL' },
  { id: 'tc', label: 'TC' },
  { id: 'tr', label: 'TR' },
  { id: 'bl', label: 'BL' },
  { id: 'br', label: 'BR' },
];

const MOUSE_LABELS: Record<'left' | 'right' | 'middle', string> = {
  left: 'Left click',
  right: 'Right click',
  middle: 'Middle click',
};

const MOUSE_SHORT: Record<'left' | 'right' | 'middle', string> = {
  left: 'LMB',
  right: 'RMB',
  middle: 'MMB',
};

function formatClock(ms: number): string {
  const totalS = Math.floor(ms / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDurationShort(ms: number): string {
  const mins = Math.floor(ms / 60_000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }
  return `${mins}m`;
}

function formatCompactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}

function getRollingWeekLabels(): string[] {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const idx = (today - 6 + i + 7) % 7;
    return days[idx];
  });
}

export const BladeTurboApp: React.FC<BladeTurboAppProps> = ({
  isExpanded = false,
  onToggleExpand,
  discordInfo,
  discordLoading = false,
  onRefreshDiscord,
  onBrandChange,
}) => {
  const initial = useMemo(() => loadSavedWorkspace(), []);

  const [page, setPage] = useState<AppPage>('dashboard');
  const [compact, setCompact] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [profiles, setProfiles] = useState<MacroProfile[]>(
    Array.isArray(initial.profiles) && initial.profiles.length > 0 ? initial.profiles : DEFAULT_PROFILES
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hud, setHud] = useState<HudConfig>(() => mergeHudConfig(initial.hud));
  const [stats, setStats] = useState<DemoStats>({ ...DEFAULT_STATS, ...(initial.stats || {}) });
  const [settings, setSettings] = useState<AppSettings>({
    ...DEFAULT_SETTINGS,
    ...(initial.settings || {}),
  });

  // Live engine state
  const [running, setRunning] = useState(false);
  const [countdownS, setCountdownS] = useState<number | null>(null);
  const [liveRate, setLiveRate] = useState(0);
  const [jitterUs, setJitterUs] = useState(0);
  const [sessionMs, setSessionMs] = useState(0);
  const [sessionInputs, setSessionInputs] = useState(0);
  const [graphPoints, setGraphPoints] = useState<number[]>(() => Array(48).fill(0));
  const [clockText, setClockText] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Interactive UI states
  const [capturingHotkey, setCapturingHotkey] = useState(false);
  const [capturingActionKey, setCapturingActionKey] = useState(false);
  const [mouseMenuOpen, setMouseMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modals inside app
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [clickTestOpen, setClickTestOpen] = useState(false);
  const [ctRunning, setCtRunning] = useState(false);
  const [ctCount, setCtCount] = useState(0);
  const [ctExpected, setCtExpected] = useState(0);
  const [ctDone, setCtDone] = useState(false);

  // Stats benchmark state
  const [benchRunning, setBenchRunning] = useState(false);
  const [benchDone, setBenchDone] = useState(true);
  const [benchResult, setBenchResult] = useState({
    meRate: 240.0,
    meJitter: 0.5,
    themRate: 65.0,
    themJitter: 11.2,
  });

  // Discord Webhook sending state
  const [webhookSending, setWebhookSending] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeProfile = profiles[selectedIdx] ?? profiles[0];
  const palette = THEME_PALETTES[settings.theme];
  const accent = settings.accent;
  const weekLabels = useMemo(() => getRollingWeekLabels(), []);

  // Duplicate hotkey detection for current profile
  const conflictingProfile = useMemo(() => {
    return profiles.find(
      (p, idx) =>
        idx !== selectedIdx &&
        p.hotkey.label.toLowerCase() === activeProfile.hotkey.label.toLowerCase()
    );
  }, [profiles, selectedIdx, activeProfile.hotkey.label]);

  const activeHudModuleCount = useMemo(() => {
    return Object.values(hud.modules).filter((m) => m.on).length;
  }, [hud.modules]);

  // Persist workspace to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles, hud, stats, settings }));
    } catch {
      // ignore storage quota issues
    }
  }, [profiles, hud, stats, settings]);

  useEffect(() => {
    onBrandChange?.(settings.appName, settings.discordInviteUrl);
  }, [settings.appName, settings.discordInviteUrl, onBrandChange]);

  // Live clock for Watermark preview
  useEffect(() => {
    const t = setInterval(() => {
      setClockText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 15_000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // Start delay countdown timer
  useEffect(() => {
    if (countdownS === null) return;
    if (countdownS <= 0) {
      setCountdownS(null);
      setRunning(true);
      setSessionMs(0);
      setSessionInputs(0);
      if (activeProfile.mode === 'hold') {
        setStats((s) => ({ ...s, clashes: s.clashes + 1 }));
      }
      if (settings.soundEnabled) {
        playMacroCue('start', settings.soundPack, settings.soundVolume);
      }
      return;
    }
    const t = setTimeout(() => {
      setCountdownS((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(t);
  }, [countdownS, activeProfile.mode, settings.soundEnabled, settings.soundPack, settings.soundVolume]);

  // Live macro simulation loop
  useEffect(() => {
    const tickMs = 120;
    const id = setInterval(() => {
      if (!running || !activeProfile) {
        setLiveRate(0);
        setJitterUs(0);
        setGraphPoints((prev) => [...prev.slice(1), 0]);
        return;
      }

      const enabledActions = Math.max(1, activeProfile.actions.filter((a) => a.enabled).length);
      const baseRate = (activeProfile.unlimited ? 1200 : activeProfile.cps) * enabledActions;
      const simulated = Math.round(baseRate * (0.992 + Math.random() * 0.016));
      const added = Math.max(1, Math.round((simulated * tickMs) / 1000));

      setLiveRate(simulated);
      setJitterUs(Number((0.35 + Math.random() * 0.3).toFixed(2)));
      setSessionMs((m) => m + tickMs);
      setSessionInputs((c) => c + added);
      setGraphPoints((prev) => [...prev.slice(1), simulated]);

      setStats((s) => {
        const nextWeek = [...s.week];
        nextWeek[6] = (nextWeek[6] || 0) + added;
        return {
          ...s,
          today: s.today + added,
          all: s.all + added,
          peak: Math.max(s.peak, simulated),
          runMs: s.runMs + tickMs,
          longestMs: Math.max(s.longestMs, sessionMs + tickMs),
          week: nextWeek,
        };
      });
    }, tickMs);

    return () => clearInterval(id);
  }, [running, activeProfile, sessionMs]);

  // Burst auto-stop effect
  useEffect(() => {
    if (!running || activeProfile.mode !== 'burst') return;
    const durationMs = Math.max(
      250,
      Math.round((activeProfile.burstCount * 1000) / Math.max(1, activeProfile.cps))
    );
    const t = setTimeout(() => {
      setRunning(false);
      if (settings.soundEnabled) {
        playMacroCue('stop', settings.soundPack, settings.soundVolume);
      }
    }, durationMs);
    return () => clearTimeout(t);
  }, [running, activeProfile, settings.soundEnabled, settings.soundPack, settings.soundVolume]);

  // Key capture for hotkey or new key input
  useEffect(() => {
    if (!capturingHotkey && !capturingActionKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setCapturingHotkey(false);
        setCapturingActionKey(false);
        return;
      }
      const label = e.key.length === 1 ? e.key.toUpperCase() : e.code.replace(/^Key|^Digit/, '');
      const vk = e.keyCode || 0x46;

      if (capturingHotkey) {
        updateActiveProfile({ hotkey: { vk, label } });
        setCapturingHotkey(false);
        showToast(`Hotkey bound to ${label}`);
      } else if (capturingActionKey) {
        updateActiveProfile({
          actions: [
            ...activeProfile.actions,
            { id: `act-${Date.now()}`, kind: 'key', vk, label, enabled: true },
          ],
        });
        setCapturingActionKey(false);
        showToast(`Added key ${label}`);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!capturingHotkey) return;
      if (e.button === 1 || e.button === 3 || e.button === 4) {
        e.preventDefault();
        const map: Record<number, { vk: number; label: string }> = {
          1: { vk: 0x04, label: 'Mouse 3' },
          3: { vk: 0x05, label: 'Mouse 4' },
          4: { vk: 0x06, label: 'Mouse 5' },
        };
        const binding = map[e.button];
        if (binding) {
          updateActiveProfile({ hotkey: binding });
          setCapturingHotkey(false);
          showToast(`Hotkey bound to ${binding.label}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousedown', handleMouseDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handleMouseDown, true);
    };
  });

  const toggleRunning = () => {
    if (countdownS !== null) {
      setCountdownS(null);
      showToast('Start cancelled');
      return;
    }

    if (running) {
      setRunning(false);
      if (settings.soundEnabled) {
        playMacroCue('stop', settings.soundPack, settings.soundVolume);
      }
      return;
    }

    if (settings.delayS > 0) {
      setCountdownS(settings.delayS);
      return;
    }

    setRunning(true);
    setSessionMs(0);
    setSessionInputs(0);
    if (activeProfile.mode === 'hold') {
      setStats((s) => ({ ...s, clashes: s.clashes + 1 }));
    }
    if (settings.soundEnabled) {
      playMacroCue('start', settings.soundPack, settings.soundVolume);
    }
  };

  const updateActiveProfile = (patch: Partial<MacroProfile>) => {
    setProfiles((prev) => prev.map((p, idx) => (idx === selectedIdx ? { ...p, ...patch } : p)));
  };

  const addProfile = () => {
    const n = profiles.length + 1;
    const newProf: MacroProfile = {
      id: `p-${Date.now()}`,
      name: `Profile ${n}`,
      icon: 'crosshair',
      actions: [{ id: `a-${Date.now()}`, kind: 'key', vk: 0x46, label: 'F', enabled: true }],
      cps: 144,
      unlimited: false,
      holdMs: 1,
      mode: 'toggle',
      burstCount: 15,
      hotkey: { vk: 0x75 + n, label: `F${Math.min(12, 5 + n)}` },
    };
    setProfiles((prev) => [...prev, newProf]);
    setSelectedIdx(profiles.length);
    showToast(`Created ${newProf.name}`);
  };

  const deleteActiveProfile = () => {
    if (profiles.length <= 1) {
      showToast('At least one profile is required');
      return;
    }
    const removed = activeProfile.name;
    setProfiles((prev) => prev.filter((_, idx) => idx !== selectedIdx));
    setSelectedIdx((idx) => Math.max(0, idx - 1));
    showToast(`Deleted ${removed}`);
  };

  const buildShareCode = (prof: MacroProfile) => {
    const payload = JSON.stringify({
      name: prof.name,
      icon: prof.icon,
      cps: prof.cps,
      unlimited: prof.unlimited,
      holdMs: prof.holdMs,
      mode: prof.mode,
      burstCount: prof.burstCount,
      actions: prof.actions,
    });
    return 'KL1:' + btoa(unescape(encodeURIComponent(payload)));
  };

  const copyShareCode = () => {
    const encoded = buildShareCode(activeProfile);
    navigator.clipboard?.writeText(encoded).catch(() => {});
    showToast('Share code copied to clipboard');
  };

  const handleImportCode = () => {
    const raw = importText.trim();
    if (!raw.startsWith('KL1:') && !raw.startsWith('BT1:')) {
      showToast('Invalid share code (must start with KL1:)');
      return;
    }
    try {
      const json = decodeURIComponent(escape(atob(raw.slice(4))));
      const parsed = JSON.parse(json) as Partial<MacroProfile>;
      if (!parsed.name || !parsed.actions) throw new Error('Malformed');
      const imported: MacroProfile = {
        id: `imp-${Date.now()}`,
        name: String(parsed.name).slice(0, 18),
        icon: parsed.icon || 'flame',
        actions: parsed.actions,
        cps: Number(parsed.cps) || 144,
        unlimited: Boolean(parsed.unlimited),
        holdMs: Number(parsed.holdMs) || 1,
        mode: parsed.mode || 'hold',
        burstCount: Number(parsed.burstCount) || 10,
        hotkey: { vk: 0x77, label: 'F8' },
      };
      setProfiles((prev) => [...prev, imported]);
      setSelectedIdx(profiles.length);
      setImportModalOpen(false);
      setImportText('');
      showToast(`Imported "${imported.name}"`);
    } catch {
      showToast('Could not parse share code');
    }
  };

  const runClickTest = () => {
    const target =
      activeProfile.mode === 'burst'
        ? activeProfile.burstCount
        : Math.min(120, Math.max(20, Math.round(activeProfile.cps * 0.5)));
    setCtExpected(target);
    setCtCount(0);
    setCtDone(false);
    setCtRunning(true);

    let current = 0;
    const stepMs = 20;
    const increment = Math.max(1, Math.ceil(target / 35));
    const timer = setInterval(() => {
      current = Math.min(target, current + increment);
      setCtCount(current);
      if (current >= target) {
        clearInterval(timer);
        setCtRunning(false);
        setCtDone(true);
      }
    }, stepMs);
  };

  const runStatsBenchmark = () => {
    setBenchRunning(true);
    setBenchDone(false);
    setTimeout(() => {
      const jitter = Number((0.42 + Math.random() * 0.18).toFixed(2));
      const themRate = Number((61 + Math.random() * 7).toFixed(1));
      setBenchResult({
        meRate: 240.0,
        meJitter: jitter,
        themRate,
        themJitter: Number((10.4 + Math.random() * 2.1).toFixed(1)),
      });
      setBenchRunning(false);
      setBenchDone(true);
      setStats((s) => ({ ...s, benchRuns: s.benchRuns + 1 }));
      showToast('Benchmark complete');
    }, 1100);
  };

  const postToDiscordWebhook = async (kind: 'test' | 'profile' | 'stats') => {
    const url = settings.discordWebhookUrl.trim();
    if (!url) {
      setWebhookStatus({ ok: false, msg: 'Paste your Discord channel webhook URL first.' });
      return;
    }

    setWebhookSending(true);
    setWebhookStatus(null);

    const shareCode = buildShareCode(activeProfile);
    const body =
      kind === 'test'
        ? {
            webhookUrl: url,
            title: `${settings.appName || 'kinglock113.cc'} Connected`,
            description: `Macro bridge connected to **${discordInfo?.guildName || "Kinglock113's server"}**.`,
            fields: [
              { name: 'Active Profile', value: activeProfile.name, inline: true },
              { name: 'Hotkey', value: activeProfile.hotkey.label, inline: true },
            ],
            footer: `${settings.appName || 'kinglock113.cc'} · ${settings.discordInviteUrl}`,
          }
        : kind === 'profile'
        ? {
            webhookUrl: url,
            title: `Profile Share: ${activeProfile.name}`,
            description: `\`\`\`\n${shareCode}\n\`\`\``,
            fields: [
              { name: 'Mode', value: activeProfile.mode.toUpperCase(), inline: true },
              {
                name: 'Speed',
                value: activeProfile.unlimited ? 'Unlimited' : `${activeProfile.cps}/s`,
                inline: true,
              },
              { name: 'Hotkey', value: activeProfile.hotkey.label, inline: true },
            ],
            footer: `Import this KL1 code at ${settings.appName || 'kinglock113.cc'}`,
          }
        : {
            webhookUrl: url,
            title: `Session & Benchmark Report`,
            description: `Latest telemetry from **${settings.appName || 'kinglock113.cc'}**.`,
            fields: [
              { name: 'Today Inputs', value: formatCompactNum(stats.today), inline: true },
              { name: 'Peak Rate', value: `${stats.peak}/s`, inline: true },
              { name: 'Clashes', value: String(stats.clashes), inline: true },
              {
                name: 'Timing Benchmark',
                value: `${benchResult.meRate.toFixed(1)}/s · ±${benchResult.meJitter} µs`,
                inline: false,
              },
            ],
            footer: `${settings.appName || 'kinglock113.cc'} · ${settings.discordInviteUrl}`,
          };

    try {
      const res = await fetch('/api/discord/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setWebhookStatus({ ok: true, msg: 'Sent directly to your Discord channel.' });
      showToast('Posted to Discord');
    } catch (err) {
      setWebhookStatus({
        ok: false,
        msg: err instanceof Error ? err.message : 'Failed to post to Discord',
      });
    } finally {
      setWebhookSending(false);
    }
  };

  const exportBackup = () => {
    const data = JSON.stringify({ version: '0.9.0', profiles, hud, settings, stats }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(settings.appName || 'kinglock113').toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
          setProfiles(parsed.profiles);
          setSelectedIdx(0);
        }
        if (parsed.hud) setHud(mergeHudConfig(parsed.hud));
        if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        if (parsed.stats) setStats(parsed.stats);
        showToast('Backup restored');
      } catch {
        showToast('Invalid backup JSON');
      }
    };
    reader.readAsText(file);
  };

  const resetAllDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfiles(DEFAULT_PROFILES);
    setSelectedIdx(0);
    setHud(DEFAULT_HUD);
    setStats(DEFAULT_STATS);
    setSettings(DEFAULT_SETTINGS);
    showToast('Reset to personal defaults');
  };

  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.test(stats, profiles.length)).length,
    [stats, profiles.length]
  );

  // Build SVG sparkline path
  const sparkPath = useMemo(() => {
    const w = 360;
    const h = 76;
    const maxVal = Math.max(100, ...graphPoints);
    const pts = graphPoints.map((val, i) => {
      const x = (i / (graphPoints.length - 1)) * w;
      const y = h - (val / maxVal) * (h - 10) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      line: `M ${pts.join(' L ')}`,
      area: `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`,
    };
  }, [graphPoints]);

  const displayBrand = (settings.appName || 'kinglock113.cc').toUpperCase();
  const enabledActionCount = Math.max(1, activeProfile.actions.filter((a) => a.enabled).length);
  const cycleIntervalMs = (1000 / Math.max(1, activeProfile.cps)).toFixed(2);

  // Helper to render any enabled HUD modules assigned to an anchor corner/edge
  const renderHudSlot = (pos: HudPosition) => {
    const bgStyle = {
      backgroundColor: `rgba(12,12,13,${hud.opacity / 100})`,
      borderColor: 'rgba(255,255,255,0.1)',
    };
    const isRight = pos === 'tr' || pos === 'br';
    const isCenter = pos === 'tc';

    return (
      <div
        className={`flex flex-col gap-1 ${
          isRight ? 'items-end text-right' : isCenter ? 'items-center text-center' : 'items-start text-left'
        }`}
      >
        {hud.modules.watermark.on && hud.modules.watermark.pos === pos && (
          <div className="px-2 py-0.5 rounded border font-mono text-[#ededee] flex items-center gap-1.5" style={bgStyle}>
            <span className="font-bold tracking-wide">{hud.modules.watermark.text || 'kinglock113.cc'}</span>
            {hud.modules.watermark.version && <span className="text-[#8e8e98]">v0.9.0</span>}
            {hud.modules.watermark.clock && <span className="text-[#8e8e98]">{clockText}</span>}
            {hud.modules.watermark.fps && (
              <span style={{ color: accent }}>{running ? `${liveRate}/s` : `${activeProfile.cps}/s`}</span>
            )}
            {hud.modules.watermark.ping && <span className="text-[#a0a0a8]">18ms</span>}
          </div>
        )}
        {hud.modules.status.on && hud.modules.status.pos === pos && (
          <div className="px-2 py-0.5 rounded border flex items-center gap-1.5 text-[#ededee]" style={bgStyle}>
            <span className="w-1.5 h-1.5 rounded-[2px]" style={{ backgroundColor: running ? accent : '#6b6b73' }} />
            <span className="font-semibold" style={{ color: accent }}>
              {activeProfile.name.toUpperCase()}
            </span>
            <span className="font-mono">{running ? `${liveRate}/s` : 'READY'}</span>
          </div>
        )}
        {hud.modules.profiles.on && hud.modules.profiles.pos === pos && (
          <div className="px-2 py-1 rounded border space-y-0.5 text-[#a0a0a8]" style={bgStyle}>
            {profiles.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ color: i === selectedIdx ? '#ededee' : undefined }}>
                {p.name}{' '}
                <span className="font-mono ml-1" style={{ color: i === selectedIdx ? accent : undefined }}>
                  {p.hotkey.label}
                </span>
              </div>
            ))}
          </div>
        )}
        {hud.modules.stats.on && hud.modules.stats.pos === pos && (
          <div className="px-2 py-0.5 rounded border font-mono text-[#ededee]" style={bgStyle}>
            Today {formatCompactNum(stats.today)} · {stats.clashes} clashes · Peak {stats.peak}/s
          </div>
        )}
        {hud.modules.keys.on && hud.modules.keys.pos === pos && (
          <div className="flex gap-1 font-mono text-[9px]">
            {activeProfile.actions
              .filter((a) => a.enabled)
              .slice(0, 3)
              .map((a) => (
                <span
                  key={a.id}
                  className="px-1.5 py-0.5 rounded border border-white/15 bg-black/70 text-white"
                >
                  {a.kind === 'key' ? a.label : MOUSE_SHORT[a.button]}
                </span>
              ))}
          </div>
        )}
        {hud.modules.graph.on && hud.modules.graph.pos === pos && (
          <div className="px-2 py-1 rounded border w-24" style={bgStyle}>
            <svg viewBox="0 0 120 22" className="w-full h-4">
              <polyline
                fill="none"
                stroke={accent}
                strokeWidth="1.5"
                points="0,18 18,16 30,8 48,6 64,12 82,4 102,7 120,5"
              />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // Compact window view
  if (compact) {
    return (
      <div
        className="relative mx-auto rounded-xl overflow-hidden shadow-2xl border select-none transition-all duration-200"
        style={{
          width: 320,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          color: palette.text,
        }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: palette.border, backgroundColor: palette.sidebar }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <BladeLogo
              className="w-4 h-4 shrink-0"
              accentColor={accent}
              bladeColor={palette.text}
              bgColor={palette.surface}
            />
            <span className="text-[11px] font-bold tracking-wider truncate">{displayBrand}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setCompact(false)}
              title="Expand to full view"
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: palette.muted }}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPinned((p) => !p)}
              title="Always on top"
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: pinned ? accent : palette.muted }}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1 font-mono tabular-nums">
              <span className="text-3xl font-semibold tracking-tight">{liveRate}</span>
              <span className="text-xs" style={{ color: palette.faint }}>/s</span>
            </div>
            <div className="text-xs mt-1 font-medium" style={{ color: running ? accent : palette.muted }}>
              {countdownS !== null ? `Starting in ${countdownS}s` : running ? 'Running' : 'Ready'}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleRunning}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: running ? accent : palette.surface,
              color: running ? '#0c0c0d' : palette.text,
              border: `1px solid ${running ? accent : palette.border}`,
            }}
            aria-label={running ? 'Stop macro' : 'Start macro'}
          >
            {running ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
        </div>

        <div
          className="grid grid-cols-3 gap-2 px-4 py-2.5 border-t text-[11px]"
          style={{ borderColor: palette.border, backgroundColor: palette.sidebar }}
        >
          <div>
            <div style={{ color: palette.faint }}>Profile</div>
            <div className="font-medium truncate">{activeProfile.name}</div>
          </div>
          <div>
            <div style={{ color: palette.faint }}>Time</div>
            <div className="font-mono tabular-nums font-medium">{formatClock(sessionMs)}</div>
          </div>
          <div>
            <div style={{ color: palette.faint }}>Total</div>
            <div className="font-mono tabular-nums font-medium">{formatCompactNum(sessionInputs)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full flex flex-col rounded-xl overflow-hidden border shadow-2xl select-none text-[13px]"
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      {/* Window Title Bar */}
      <div
        className="h-10 px-3.5 flex items-center justify-between border-b shrink-0"
        style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BladeLogo
            className="w-4 h-4 shrink-0"
            accentColor={accent}
            bladeColor={palette.text}
            bgColor={palette.surface}
          />
          <span className="font-display text-xs font-bold tracking-wider truncate">
            {displayBrand}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              downloadPersonalizedWindowsApp()
                .then(() => showToast('Downloaded kinglock113-windows.zip'))
                .catch(() => showToast('Download failed'));
            }}
            className="px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: accent, color: '#0c0c0d' }}
            title="Download Windows app with your current profiles"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Windows .EXE</span>
          </button>
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: palette.muted }}
              title={isExpanded ? 'Dock to hero' : 'Open full size'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isExpanded ? 'Dock' : 'Full view'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setCompact(true)}
            title="Switch to compact widget"
            className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: palette.muted }}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPinned((p) => !p);
              showToast(!pinned ? 'Always on top enabled' : 'Always on top disabled');
            }}
            title="Always on top"
            className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: pinned ? accent : palette.muted }}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split: Sidebar + Pages */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <aside
          className="w-40 sm:w-44 shrink-0 border-r flex flex-col justify-between p-2.5"
          style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
        >
          <nav className="space-y-1">
            {(
              [
                { id: 'dashboard', label: 'Dashboard', Icon: LayoutGrid },
                { id: 'profiles', label: 'Profiles', Icon: Layers },
                { id: 'overlay', label: 'Overlay', Icon: Monitor },
                { id: 'stats', label: 'Stats', Icon: BarChart3 },
                { id: 'discord', label: 'Discord', Icon: MessageSquare },
                { id: 'settings', label: 'Settings', Icon: SettingsIcon },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPage(id)}
                  className="relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: active ? palette.surface : 'transparent',
                    color: active ? palette.text : palette.muted,
                  }}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? accent : palette.faint }} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="space-y-2.5">
            {/* Live Engine Box */}
            <div
              className="p-2.5 rounded-lg border"
              style={{ backgroundColor: palette.card, borderColor: palette.border }}
            >
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="w-1.5 h-1.5 rounded-[2px]"
                  style={{ backgroundColor: running ? accent : palette.faint }}
                />
                <span className="font-semibold" style={{ color: running ? accent : palette.muted }}>
                  {countdownS !== null ? `Wait ${countdownS}s` : running ? 'Active' : 'Ready'}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1 font-mono tabular-nums">
                <span className="text-lg font-semibold leading-none">{liveRate}</span>
                <span className="text-[10px]" style={{ color: palette.faint }}>/s</span>
              </div>
              <div className="mt-1 text-[11px] truncate" style={{ color: palette.faint }}>
                {activeProfile.name} · {activeProfile.hotkey.label}
              </div>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px]" style={{ color: palette.faint }}>
              <span className="font-mono">v0.9.0</span>
              <button
                type="button"
                onClick={() => setWhatsNewOpen(true)}
                className="underline hover:opacity-80 cursor-pointer"
                style={{ color: palette.muted }}
              >
                What&apos;s new
              </button>
            </div>
          </div>
        </aside>

        {/* Active Page Canvas */}
        <div className="flex-1 overflow-y-auto bt-scroll p-4 sm:p-5">
          {/* ================= DASHBOARD ================= */}
          {page === 'dashboard' && (
            <div className="space-y-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h3 className="font-display text-base font-semibold tracking-tight">Dashboard</h3>
                  <p className="text-xs" style={{ color: palette.muted }}>
                    Live control and session overview
                  </p>
                </div>
                <span className="text-[11px] font-mono" style={{ color: palette.faint }}>
                  {activeProfile.mode.toUpperCase()} · {activeProfile.unlimited ? 'UNLIMITED' : `${activeProfile.cps}/s`}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                {/* Main Dial + Graph */}
                <div
                  className="lg:col-span-7 rounded-xl border p-4 flex flex-col justify-between gap-4"
                  style={{ backgroundColor: palette.card, borderColor: palette.border }}
                >
                  <div className="flex items-center gap-5">
                    <StartDialButton
                      running={running}
                      countdown={countdownS}
                      hotkeyLabel={activeProfile.hotkey.label}
                      accent={accent}
                      surfaceColor={palette.surface}
                      borderColor={palette.border}
                      textColor={palette.text}
                      faintColor={palette.faint}
                      onClick={toggleRunning}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: palette.faint }}>
                        INPUTS / SEC
                      </div>
                      <div className="font-mono tabular-nums text-3xl font-semibold tracking-tight leading-tight">
                        {liveRate.toLocaleString('en-US')}
                      </div>
                      <div
                        className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded border text-[11px]"
                        style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-[2px]"
                          style={{ backgroundColor: running ? accent : palette.faint }}
                        />
                        <span style={{ color: running ? palette.text : palette.muted }}>
                          {countdownS !== null ? `Starting (${countdownS}s)` : running ? 'Running' : 'Ready'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>TIME</div>
                          <div className="font-mono tabular-nums font-medium">{formatClock(sessionMs)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>TOTAL</div>
                          <div className="font-mono tabular-nums font-medium">{formatCompactNum(sessionInputs)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>JITTER</div>
                          <div className="font-mono tabular-nums font-medium">
                            {running ? `±${jitterUs} µs` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live 10s Graph */}
                  <div
                    className="relative rounded-lg border p-2.5 overflow-hidden"
                    style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: palette.faint }}>
                      <span>Output rate</span>
                      <span className="font-mono">last 10s</span>
                    </div>
                    <svg viewBox="0 0 360 76" className="w-full h-16 overflow-visible">
                      <path d={sparkPath.area} fill={`${accent}22`} />
                      <path d={sparkPath.line} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Right Column: Quick Switch + Engine */}
                <div className="lg:col-span-5 flex flex-col gap-3.5">
                  <div
                    className="rounded-xl border p-3.5"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="text-[11px] font-mono font-semibold tracking-wider uppercase mb-2.5 flex items-center justify-between">
                      <span>
                        <span style={{ color: accent }}>01</span> QUICK SWITCH
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage('profiles')}
                        className="text-[11px] font-sans normal-case font-medium hover:underline cursor-pointer"
                        style={{ color: accent }}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {profiles.slice(0, 4).map((p, idx) => {
                        const isSel = idx === selectedIdx;
                        const Icon = ICON_MAP[p.icon] || Flame;
                        const modeSub =
                          p.mode === 'burst'
                            ? `Burst · ${p.burstCount}×`
                            : `${p.mode.charAt(0).toUpperCase() + p.mode.slice(1)} · ${p.unlimited ? 'max' : `${p.cps}/s`}`;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedIdx(idx);
                              setRunning(false);
                              setCountdownS(null);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer"
                            style={{
                              backgroundColor: isSel ? palette.surface : 'transparent',
                              borderColor: isSel ? accent : palette.border,
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isSel ? accent : palette.faint }} />
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">{p.name}</div>
                                <div className="text-[10px]" style={{ color: palette.faint }}>{modeSub}</div>
                              </div>
                            </div>
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ml-2"
                              style={{
                                backgroundColor: palette.sidebar,
                                borderColor: palette.border,
                                color: palette.muted,
                              }}
                            >
                              {p.hotkey.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className="rounded-xl border p-3.5 flex-1"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="text-[11px] font-mono font-semibold tracking-wider uppercase mb-2.5">
                      <span style={{ color: accent }}>02</span> ENGINE
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[11px]">
                      <div>
                        <div className="text-[9px] font-mono uppercase" style={{ color: palette.faint }}>INPUT</div>
                        <div className="font-medium mt-0.5">SendInput · batched</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono uppercase" style={{ color: palette.faint }}>HOTKEYS</div>
                        <div className="font-medium mt-0.5">Input hook · instant</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono uppercase" style={{ color: palette.faint }}>ROBLOX</div>
                        <div className="font-medium mt-0.5" style={{ color: settings.robloxOnly ? accent : palette.text }}>
                          {settings.robloxOnly ? 'Focused' : 'Any window'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono uppercase" style={{ color: palette.faint }}>OVERLAY</div>
                        <div className="font-medium mt-0.5">{hud.enabled ? 'On' : 'Off'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono uppercase" style={{ color: palette.faint }}>PING ~ NET</div>
                        <div className="font-mono mt-0.5">{running ? '18 ms' : '—'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono uppercase" style={{ color: palette.faint }}>DISCORD</div>
                        <button
                          type="button"
                          onClick={() => setPage('discord')}
                          className="truncate max-w-full hover:underline cursor-pointer mt-0.5 text-left"
                          style={{ color: accent }}
                        >
                          {discordInfo?.guildName || "Kinglock113's server"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Session Strip */}
              <div
                className="rounded-xl border px-4 py-3 grid grid-cols-5 gap-2 text-center sm:text-left"
                style={{ backgroundColor: palette.card, borderColor: palette.border }}
              >
                <div>
                  <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>TODAY</div>
                  <div className="font-mono tabular-nums text-sm font-semibold mt-0.5">{formatCompactNum(stats.today)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>ALL TIME</div>
                  <div className="font-mono tabular-nums text-sm font-semibold mt-0.5">{formatCompactNum(stats.all)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>CLASHES</div>
                  <div className="font-mono tabular-nums text-sm font-semibold mt-0.5">{stats.clashes}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>PEAK</div>
                  <div className="font-mono tabular-nums text-sm font-semibold mt-0.5">{stats.peak.toLocaleString('en-US')}/s</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>ACHIEVEMENTS</div>
                  <div className="font-mono tabular-nums text-sm font-semibold mt-0.5">
                    {unlockedCount} / {ACHIEVEMENTS.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PROFILES ================= */}
          {page === 'profiles' && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h3 className="font-display text-base font-semibold tracking-tight">Profiles</h3>
                  <p className="text-xs" style={{ color: palette.muted }}>
                    Each profile has its own inputs, speed and hotkey
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCtDone(false);
                      setCtCount(0);
                      setClickTestOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-md border text-[11px] font-medium hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
                    style={{ borderColor: palette.border, backgroundColor: palette.card }}
                  >
                    Click test
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-md border text-[11px] font-medium hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
                    style={{ borderColor: palette.border, backgroundColor: palette.card }}
                  >
                    Import code
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {profiles.map((p, idx) => {
                  const isSel = idx === selectedIdx;
                  const Icon = ICON_MAP[p.icon] || Flame;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      style={{
                        backgroundColor: isSel ? palette.surface : palette.card,
                        borderColor: isSel ? accent : palette.border,
                        color: isSel ? palette.text : palette.muted,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: isSel ? accent : palette.faint }} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={addProfile}
                  className="px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 hover:bg-white/5 transition-colors cursor-pointer"
                  style={{ borderColor: palette.border, color: palette.muted }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                <div
                  className="rounded-xl border p-3.5 space-y-3"
                  style={{ backgroundColor: palette.card, borderColor: palette.border }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span style={{ color: accent }}>01</span> ACTIVATION
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={copyShareCode}
                        title="Copy share code"
                        className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                        style={{ color: palette.muted }}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={deleteActiveProfile}
                        title="Delete profile"
                        className="p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                        style={{ color: palette.muted }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: palette.faint }}>
                        Profile name
                      </label>
                      <input
                        type="text"
                        maxLength={18}
                        value={activeProfile.name}
                        onChange={(e) => updateActiveProfile({ name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-md border text-xs outline-none"
                        style={{
                          backgroundColor: palette.sidebar,
                          borderColor: palette.border,
                          color: palette.text,
                        }}
                      />
                    </div>

                    <div>
                      <div className="text-[11px] mb-1" style={{ color: palette.faint }}>Icon</div>
                      <div className="flex items-center gap-1.5">
                        {(Object.keys(ICON_MAP) as ProfileIcon[]).map((iconKey) => {
                          const Icon = ICON_MAP[iconKey];
                          const active = activeProfile.icon === iconKey;
                          return (
                            <button
                              key={iconKey}
                              type="button"
                              onClick={() => updateActiveProfile({ icon: iconKey })}
                              className="p-2 rounded-md border transition-colors cursor-pointer"
                              style={{
                                backgroundColor: active ? accent : palette.sidebar,
                                borderColor: active ? accent : palette.border,
                                color: active ? '#0c0c0d' : palette.muted,
                              }}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] mb-1" style={{ color: palette.faint }}>Mode</div>
                      <div
                        className="grid grid-cols-3 gap-1 p-1 rounded-lg border"
                        style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                      >
                        {(['toggle', 'hold', 'burst'] as ActivationMode[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => updateActiveProfile({ mode: m })}
                            className="py-1.5 rounded text-xs font-medium capitalize transition-colors cursor-pointer"
                            style={{
                              backgroundColor: activeProfile.mode === m ? accent : 'transparent',
                              color: activeProfile.mode === m ? '#0c0c0d' : palette.muted,
                            }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] mt-1.5" style={{ color: palette.faint }}>
                        {MODE_DESCRIPTIONS[activeProfile.mode]}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <div>
                        <div className="text-[11px] mb-1" style={{ color: palette.faint }}>
                          Hotkey (keyboard or Mouse 3/4/5)
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCapturingActionKey(false);
                            setCapturingHotkey(true);
                          }}
                          className="w-full px-3 py-2 rounded-md border font-mono text-xs font-semibold text-center transition-colors cursor-pointer"
                          style={{
                            backgroundColor: capturingHotkey ? `${accent}20` : palette.sidebar,
                            borderColor: capturingHotkey ? accent : palette.border,
                            color: capturingHotkey ? accent : palette.text,
                          }}
                        >
                          {capturingHotkey ? 'Press key...' : activeProfile.hotkey.label}
                        </button>
                        {conflictingProfile && (
                          <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#f5b731' }}>
                            &ldquo;{conflictingProfile.name}&rdquo; uses the same hotkey. Pick a different one.
                          </p>
                        )}
                      </div>

                      {activeProfile.mode === 'burst' && (
                        <div>
                          <label className="block text-[11px] mb-1" style={{ color: palette.faint }}>
                            Cycles per burst
                          </label>
                          <div
                            className="flex items-center px-2.5 py-1.5 rounded-md border"
                            style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                          >
                            <input
                              type="number"
                              min={1}
                              max={1000}
                              value={activeProfile.burstCount}
                              onChange={(e) =>
                                updateActiveProfile({
                                  burstCount: Math.max(1, Math.min(1000, Number(e.target.value) || 1)),
                                })
                              }
                              className="w-full bg-transparent text-xs font-mono tabular-nums outline-none"
                            />
                            <span className="text-[11px] font-mono" style={{ color: palette.faint }}>×</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div
                    className="rounded-xl border p-3.5 space-y-2.5"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                        <span style={{ color: accent }}>02</span> INPUTS
                      </span>
                      <div className="flex items-center gap-1.5 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setCapturingHotkey(false);
                            setCapturingActionKey((v) => !v);
                          }}
                          className="px-2 py-1 rounded border text-[11px] font-medium hover:bg-white/5 cursor-pointer"
                          style={{
                            borderColor: capturingActionKey ? accent : palette.border,
                            color: capturingActionKey ? accent : palette.text,
                          }}
                        >
                          {capturingActionKey ? 'Press key...' : '+ Key'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMouseMenuOpen((o) => !o)}
                          className="px-2 py-1 rounded border text-[11px] font-medium hover:bg-white/5 cursor-pointer"
                          style={{ borderColor: palette.border }}
                        >
                          + Mouse
                        </button>
                        {mouseMenuOpen && (
                          <div
                            className="absolute right-0 top-full mt-1 w-32 rounded-lg border shadow-xl py-1 z-20"
                            style={{ backgroundColor: palette.card, borderColor: palette.border }}
                          >
                            {(['left', 'right', 'middle'] as const).map((btn) => (
                              <button
                                key={btn}
                                type="button"
                                onClick={() => {
                                  updateActiveProfile({
                                    actions: [
                                      ...activeProfile.actions,
                                      { id: `act-${Date.now()}`, kind: 'mouse', button: btn, enabled: true },
                                    ],
                                  });
                                  setMouseMenuOpen(false);
                                }}
                                className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 cursor-pointer"
                              >
                                {MOUSE_LABELS[btn]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {activeProfile.actions.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg border"
                          style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="px-2 py-0.5 rounded border font-mono text-[11px] font-semibold"
                              style={{ backgroundColor: palette.surface, borderColor: palette.border }}
                            >
                              {act.kind === 'key' ? act.label : MOUSE_SHORT[act.button]}
                            </span>
                            <span className="text-xs" style={{ color: palette.muted }}>
                              {act.kind === 'key' ? `Key ${act.label}` : MOUSE_LABELS[act.button]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ToggleSwitch
                              checked={act.enabled}
                              accent={accent}
                              label="Enable input"
                              onChange={(next) =>
                                updateActiveProfile({
                                  actions: activeProfile.actions.map((a) =>
                                    a.id === act.id ? { ...a, enabled: next } : a
                                  ),
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (activeProfile.actions.length <= 1) {
                                  showToast('Keep at least one input');
                                  return;
                                }
                                updateActiveProfile({
                                  actions: activeProfile.actions.filter((a) => a.id !== act.id),
                                });
                              }}
                              className="p-1 rounded hover:bg-white/10 cursor-pointer"
                              style={{ color: palette.faint }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-xl border p-3.5 space-y-2.5"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                        <span style={{ color: accent }}>03</span> SPEED
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span style={{ color: palette.muted }}>Unlimited</span>
                        <ToggleSwitch
                          checked={activeProfile.unlimited}
                          accent={accent}
                          label="Unlimited speed"
                          onChange={(next) => updateActiveProfile({ unlimited: next })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {[20, 60, 144, 240, 500].map((val) => {
                        const activePreset = !activeProfile.unlimited && activeProfile.cps === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateActiveProfile({ cps: val, unlimited: false })}
                            className="py-1.5 rounded border font-mono text-[11px] tabular-nums transition-colors cursor-pointer"
                            style={{
                              backgroundColor: activePreset ? `${accent}30` : palette.sidebar,
                              borderColor: activePreset ? accent : palette.border,
                              color: activePreset ? accent : palette.text,
                            }}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <input
                        type="range"
                        min={1}
                        max={1000}
                        disabled={activeProfile.unlimited}
                        value={Math.min(1000, activeProfile.cps)}
                        onChange={(e) => updateActiveProfile({ cps: Number(e.target.value) })}
                        className="flex-1 accent-[#ff5a1f]"
                      />
                      <div
                        className="w-28 flex items-center px-2.5 py-1.5 rounded border"
                        style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                      >
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          disabled={activeProfile.unlimited}
                          value={activeProfile.cps}
                          onChange={(e) =>
                            updateActiveProfile({ cps: Math.max(1, Number(e.target.value) || 1) })
                          }
                          className="w-full bg-transparent text-xs font-mono tabular-nums outline-none"
                        />
                        <span className="text-[10px] shrink-0" style={{ color: palette.faint }}>cycles/s</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px]" style={{ color: palette.muted }}>Hold time</span>
                      <div
                        className="w-24 flex items-center px-2.5 py-1.5 rounded border"
                        style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                      >
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={activeProfile.holdMs}
                          onChange={(e) => updateActiveProfile({ holdMs: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-full bg-transparent text-xs font-mono tabular-nums outline-none"
                        />
                        <span className="text-[10px]" style={{ color: palette.faint }}>ms</span>
                      </div>
                    </div>

                    <p className="text-[11px] pt-0.5" style={{ color: palette.faint }}>
                      {activeProfile.unlimited
                        ? `No delay. Runs as fast as the system allows (${enabledActionCount} inputs per cycle).`
                        : `Fires 1 cycle every ${cycleIntervalMs} ms (${enabledActionCount} inputs per cycle).`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= OVERLAY ================= */}
          {page === 'overlay' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h3 className="font-display text-base font-semibold tracking-tight">Overlay</h3>
                  <p className="text-xs" style={{ color: palette.muted }}>
                    In-game HUD drawn on top of Roblox. Click-through, never blocks the game.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs" style={{ color: hud.enabled ? palette.text : palette.muted }}>
                    {hud.enabled ? 'On' : 'Off'}
                  </span>
                  <ToggleSwitch
                    checked={hud.enabled}
                    accent={accent}
                    label="Toggle in-game HUD"
                    onChange={(next) => setHud((h) => ({ ...h, enabled: next }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                <div className="lg:col-span-6 space-y-3.5">
                  <div
                    className="rounded-xl border p-3.5"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between mb-2.5 text-[11px]">
                      <span className="font-mono font-semibold uppercase tracking-wider">
                        <span style={{ color: accent }}>01</span> PREVIEW
                      </span>
                      <span style={{ color: palette.faint }}>your screen</span>
                    </div>
                    <div
                      className="relative h-52 rounded-lg border overflow-hidden p-2.5 text-[10px]"
                      style={{
                        background: 'radial-gradient(circle at 50% 45%, #23242b 0%, #101116 100%)',
                        borderColor: palette.border,
                        opacity: hud.enabled ? 1 : 0.45,
                      }}
                    >
                      <div
                        className="absolute inset-2.5 pointer-events-none"
                        style={{
                          transform: `scale(${Math.max(0.75, Math.min(1.15, hud.scale / 100))})`,
                          transformOrigin: 'center center',
                        }}
                      >
                        <div className="absolute top-0 left-0">{renderHudSlot('tl')}</div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2">{renderHudSlot('tc')}</div>
                        <div className="absolute top-0 right-0">{renderHudSlot('tr')}</div>
                        <div className="absolute bottom-0 left-0">{renderHudSlot('bl')}</div>
                        <div className="absolute bottom-0 right-0">{renderHudSlot('br')}</div>
                      </div>

                      {hud.modules.crosshair.on && (
                        <div
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                      )}
                    </div>
                  </div>

                  <div
                    className="rounded-xl border p-3.5 space-y-3"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span style={{ color: accent }}>02</span> DISPLAY
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium">Only over Roblox</div>
                        <div className="text-[10px]" style={{ color: palette.faint }}>
                          Hides the HUD when you alt-tab
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={hud.onlyRoblox}
                        accent={accent}
                        label="Show HUD only over Roblox"
                        onChange={(next) => setHud((h) => ({ ...h, onlyRoblox: next }))}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span style={{ color: palette.muted }}>Scale</span>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="range"
                          min={70}
                          max={150}
                          step={5}
                          value={hud.scale}
                          onChange={(e) => setHud((h) => ({ ...h, scale: Number(e.target.value) }))}
                          className="w-32 accent-[#ff5a1f]"
                        />
                        <span className="font-mono text-[11px] w-9 text-right" style={{ color: palette.muted }}>
                          {hud.scale}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span style={{ color: palette.muted }}>Background</span>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="range"
                          min={20}
                          max={100}
                          step={5}
                          value={hud.opacity}
                          onChange={(e) => setHud((h) => ({ ...h, opacity: Number(e.target.value) }))}
                          className="w-32 accent-[#ff5a1f]"
                        />
                        <span className="font-mono text-[11px] w-9 text-right" style={{ color: palette.muted }}>
                          {hud.opacity}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="lg:col-span-6 rounded-xl border p-3.5 space-y-2.5"
                  style={{ backgroundColor: palette.card, borderColor: palette.border }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span style={{ color: accent }}>03</span> MODULES
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: palette.faint }}>
                      {activeHudModuleCount} active
                    </span>
                  </div>

                  {/* Watermark card with text + Clock/Version/Rate/Ping sub-toggles */}
                  <div
                    className="p-2.5 rounded-lg border space-y-2"
                    style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium">Watermark</div>
                        <div className="text-[10px]" style={{ color: palette.faint }}>
                          Custom name, clock and version
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={hud.modules.watermark.on}
                        accent={accent}
                        label="Watermark module"
                        onChange={(next) =>
                          setHud((h) => ({
                            ...h,
                            modules: {
                              ...h.modules,
                              watermark: { ...h.modules.watermark, on: next },
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {POS_LABELS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setHud((h) => ({
                              ...h,
                              modules: {
                                ...h.modules,
                                watermark: { ...h.modules.watermark, pos: p.id },
                              },
                            }))
                          }
                          className="py-1 rounded text-[10px] font-mono font-semibold cursor-pointer"
                          style={{
                            backgroundColor:
                              hud.modules.watermark.pos === p.id ? accent : palette.surface,
                            color: hud.modules.watermark.pos === p.id ? '#0c0c0d' : palette.faint,
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      maxLength={24}
                      value={hud.modules.watermark.text}
                      onChange={(e) =>
                        setHud((h) => ({
                          ...h,
                          modules: {
                            ...h.modules,
                            watermark: { ...h.modules.watermark, text: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded border text-xs outline-none"
                      style={{
                        backgroundColor: palette.bg,
                        borderColor: palette.border,
                        color: palette.text,
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-0.5 text-[11px]">
                      {(
                        [
                          { key: 'clock', label: 'Clock' },
                          { key: 'version', label: 'Version' },
                          { key: 'fps', label: 'Rate' },
                          { key: 'ping', label: 'Ping' },
                        ] as const
                      ).map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <ToggleSwitch
                            checked={hud.modules.watermark[key]}
                            accent={accent}
                            label={`Watermark ${label}`}
                            onChange={(next) =>
                              setHud((h) => ({
                                ...h,
                                modules: {
                                  ...h.modules,
                                  watermark: { ...h.modules.watermark, [key]: next },
                                },
                              }))
                            }
                          />
                          <span style={{ color: palette.muted }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remaining 6 HUD modules */}
                  {(
                    [
                      {
                        key: 'status',
                        label: 'Status',
                        desc: 'Active profile, state and live rate',
                      },
                      {
                        key: 'profiles',
                        label: 'Profile list',
                        desc: 'All profiles and hotkeys, active one highlighted',
                      },
                      {
                        key: 'stats',
                        label: 'Session stats',
                        desc: 'Time, inputs today, clashes, peak',
                      },
                      {
                        key: 'keys',
                        label: 'Live keys',
                        desc: 'Active input triggers shown in real time',
                      },
                      {
                        key: 'graph',
                        label: 'Rate graph',
                        desc: 'Live timing trace rendered in-game',
                      },
                      {
                        key: 'crosshair',
                        label: 'Center dot',
                        desc: 'Minimal center-screen target reticle',
                      },
                    ] as const
                  ).map(({ key, label, desc }) => {
                    const mod = hud.modules[key];
                    return (
                      <div
                        key={key}
                        className="p-2.5 rounded-lg border space-y-2"
                        style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-medium">{label}</div>
                            <div className="text-[10px]" style={{ color: palette.faint }}>{desc}</div>
                          </div>
                          <ToggleSwitch
                            checked={mod.on}
                            accent={accent}
                            label={label}
                            onChange={(next) =>
                              setHud((h) => ({
                                ...h,
                                modules: {
                                  ...h.modules,
                                  [key]: { ...h.modules[key], on: next },
                                },
                              }))
                            }
                          />
                        </div>
                        {key !== 'crosshair' && (
                          <div className="grid grid-cols-5 gap-1">
                            {POS_LABELS.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() =>
                                  setHud((h) => ({
                                    ...h,
                                    modules: {
                                      ...h.modules,
                                      [key]: { ...h.modules[key], pos: p.id },
                                    },
                                  }))
                                }
                                className="py-1 rounded text-[10px] font-mono font-semibold cursor-pointer"
                                style={{
                                  backgroundColor: mod.pos === p.id ? accent : palette.surface,
                                  color: mod.pos === p.id ? '#0c0c0d' : palette.faint,
                                }}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STATS ================= */}
          {page === 'stats' && (
            <div className="space-y-3.5">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h3 className="font-display text-base font-semibold tracking-tight">Stats</h3>
                <p className="text-xs" style={{ color: palette.muted }}>
                  Your history, achievements and timing benchmark
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                <div className="lg:col-span-6 space-y-3.5">
                  {/* 01 OVERVIEW with 2x3 metrics + 7-day chart */}
                  <div
                    className="rounded-xl border p-4 space-y-4"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span style={{ color: accent }}>01</span> OVERVIEW
                    </div>

                    <div className="grid grid-cols-3 gap-x-3 gap-y-3.5">
                      <div>
                        <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>TODAY</div>
                        <div className="font-mono tabular-nums text-base font-semibold mt-0.5">
                          {formatCompactNum(stats.today)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>ALL TIME</div>
                        <div className="font-mono tabular-nums text-base font-semibold mt-0.5">
                          {formatCompactNum(stats.all)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>RUN TIME</div>
                        <div className="font-mono tabular-nums text-base font-semibold mt-0.5">
                          {formatDurationShort(stats.runMs)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>LONGEST</div>
                        <div className="font-mono tabular-nums text-base font-semibold mt-0.5">
                          {formatDurationShort(stats.longestMs)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>CLASHES</div>
                        <div className="font-mono tabular-nums text-base font-semibold mt-0.5">
                          {stats.clashes}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase" style={{ color: palette.faint }}>PEAK</div>
                        <div className="font-mono tabular-nums text-base font-semibold mt-0.5">
                          {stats.peak.toLocaleString('en-US')}/s
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end gap-2 h-24 pt-2 border-t" style={{ borderColor: palette.border }}>
                      {stats.week.map((val, idx) => {
                        const max = Math.max(...stats.week, 1);
                        const hPct = val > 0 ? Math.max(10, Math.round((val / max) * 100)) : 5;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full flex items-end h-16">
                              <div
                                className="w-full rounded-t transition-all"
                                style={{
                                  height: `${hPct}%`,
                                  backgroundColor: idx === 6 ? accent : palette.surface,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-mono" style={{ color: palette.faint }}>
                              {weekLabels[idx]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 02 BENCHMARK */}
                  <div
                    className="rounded-xl border p-4 space-y-3"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                        <span style={{ color: accent }}>02</span> BENCHMARK
                      </span>
                      <button
                        type="button"
                        onClick={runStatsBenchmark}
                        disabled={benchRunning}
                        className="px-3 py-1 rounded border text-xs font-medium cursor-pointer hover:bg-white/5"
                        style={{
                          borderColor: palette.border,
                          backgroundColor: palette.surface,
                        }}
                      >
                        {benchRunning ? 'Measuring...' : 'Run test'}
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: palette.muted }}>
                      Measures timing precision on <em>your</em> PC against a typical Sleep()-based macro. Sends no inputs.
                    </p>
                    {benchDone && (
                      <div className="space-y-2.5 text-xs pt-1">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold">{settings.appName || 'kinglock113.cc'}</span>
                            <span className="font-mono tabular-nums" style={{ color: accent }}>
                              {benchResult.meRate.toFixed(1)}/s · ±{benchResult.meJitter} µs
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: palette.sidebar }}>
                            <div className="h-full rounded-full w-full" style={{ backgroundColor: accent }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span style={{ color: palette.muted }}>Typical Sleep() macro</span>
                            <span className="font-mono tabular-nums" style={{ color: palette.muted }}>
                              {benchResult.themRate}/s · ±{benchResult.themJitter} ms
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: palette.sidebar }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round((benchResult.themRate / benchResult.meRate) * 100)}%`,
                                backgroundColor: palette.faint,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 03 ACHIEVEMENTS */}
                <div
                  className="lg:col-span-6 rounded-xl border p-4"
                  style={{ backgroundColor: palette.card, borderColor: palette.border }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span style={{ color: accent }}>03</span> ACHIEVEMENTS
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: palette.faint }}>
                      {unlockedCount} / {ACHIEVEMENTS.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ACHIEVEMENTS.map((ach) => {
                      const unlocked = ach.test(stats, profiles.length);
                      const AchIcon = ACHIEVEMENT_ICONS[ach.id] || Play;
                      return (
                        <div
                          key={ach.id}
                          className="p-3 rounded-lg border flex items-center gap-3"
                          style={{
                            backgroundColor: palette.sidebar,
                            borderColor: unlocked ? `${accent}66` : palette.border,
                            opacity: unlocked ? 1 : 0.52,
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: unlocked ? `${accent}18` : palette.surface,
                              color: unlocked ? accent : palette.faint,
                            }}
                          >
                            <AchIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{ach.name}</div>
                            <div className="text-[10px]" style={{ color: palette.faint }}>
                              {ach.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= DISCORD ================= */}
          {page === 'discord' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold tracking-tight">Discord Server</h3>
                  <p className="text-xs" style={{ color: palette.muted }}>
                    Connected to your server & channel webhook bridge
                  </p>
                </div>
                {onRefreshDiscord && (
                  <button
                    type="button"
                    onClick={onRefreshDiscord}
                    disabled={discordLoading}
                    className="px-2.5 py-1.5 rounded-md border text-[11px] font-medium flex items-center gap-1.5 hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: palette.border, backgroundColor: palette.card }}
                  >
                    <RefreshCw className={`w-3 h-3 ${discordLoading ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                )}
              </div>

              <div
                className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                style={{ backgroundColor: palette.card, borderColor: palette.border }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold">
                    {discordInfo?.guildName || "Kinglock113's server"}
                  </div>
                  <div className="text-xs font-mono" style={{ color: palette.muted }}>
                    #{discordInfo?.channelName || 'general'}
                    {discordInfo?.onlineCount !== null && discordInfo?.onlineCount !== undefined
                      ? ` · ${discordInfo.onlineCount} online`
                      : ''}
                    {discordInfo?.memberCount !== null && discordInfo?.memberCount !== undefined
                      ? ` · ${discordInfo.memberCount} members`
                      : ''}
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: palette.faint }}>
                    {settings.discordInviteUrl || DISCORD_INVITE_URL}
                  </div>
                </div>

                <a
                  href={settings.discordInviteUrl || DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#5865f2', color: '#ffffff' }}
                >
                  <span>Open Server</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div
                className="rounded-xl border p-4 space-y-3"
                style={{ backgroundColor: palette.card, borderColor: palette.border }}
              >
                <div>
                  <div className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                    <span style={{ color: accent }}>01</span> CHANNEL WEBHOOK BRIDGE
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: palette.faint }}>
                    Paste a Discord channel webhook URL from Server Settings → Integrations to post profile share codes and live session stats straight into your server.
                  </p>
                </div>

                <input
                  type="url"
                  value={settings.discordWebhookUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, discordWebhookUrl: e.target.value }))}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3 py-2 rounded-lg border text-xs font-mono outline-none"
                  style={{
                    backgroundColor: palette.sidebar,
                    borderColor: palette.border,
                    color: palette.text,
                  }}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={webhookSending}
                    onClick={() => postToDiscordWebhook('profile')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: accent, color: '#0c0c0d' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Share &ldquo;{activeProfile.name}&rdquo;</span>
                  </button>
                  <button
                    type="button"
                    disabled={webhookSending}
                    onClick={() => postToDiscordWebhook('stats')}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer hover:bg-white/5"
                    style={{ borderColor: palette.border, backgroundColor: palette.sidebar }}
                  >
                    Post Session Stats
                  </button>
                  <button
                    type="button"
                    disabled={webhookSending}
                    onClick={() => postToDiscordWebhook('test')}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer hover:bg-white/5"
                    style={{ borderColor: palette.border, backgroundColor: palette.sidebar }}
                  >
                    Test Ping
                  </button>
                </div>

                {webhookStatus && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: webhookStatus.ok ? '#2ee59d' : '#ff5a5f' }}
                  >
                    {webhookStatus.msg}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================= SETTINGS ================= */}
          {page === 'settings' && (
            <div className="space-y-3.5">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h3 className="font-display text-base font-semibold tracking-tight">Settings</h3>
                <p className="text-xs" style={{ color: palette.muted }}>
                  Behavior, sound and appearance
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                <div className="space-y-3.5">
                  {/* 01 GENERAL */}
                  <div
                    className="rounded-xl border p-3.5 space-y-3"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span style={{ color: accent }}>01</span> GENERAL
                    </div>
                    {(
                      [
                        {
                          key: 'robloxOnly',
                          label: 'Roblox only',
                          desc: 'Hotkeys and inputs only work while Roblox is focused',
                        },
                        {
                          key: 'closeToTray',
                          label: 'Close to tray',
                          desc: '× hides the window, app keeps running',
                        },
                        {
                          key: 'autostart',
                          label: 'Start with Windows',
                          desc: 'Launches minimized to the tray',
                        },
                      ] as const
                    ).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-medium">{label}</div>
                          <div className="text-[10px]" style={{ color: palette.faint }}>{desc}</div>
                        </div>
                        <ToggleSwitch
                          checked={settings[key]}
                          accent={accent}
                          label={label}
                          onChange={(next) => setSettings((s) => ({ ...s, [key]: next }))}
                        />
                      </div>
                    ))}

                    <div className="flex items-center justify-between gap-3 pt-1 border-t" style={{ borderColor: palette.border }}>
                      <div>
                        <div className="text-xs font-medium">Start delay</div>
                        <div className="text-[10px]" style={{ color: palette.faint }}>
                          Countdown when starting with the button
                        </div>
                      </div>
                      <div
                        className="w-20 flex items-center px-2.5 py-1.5 rounded-md border"
                        style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
                      >
                        <input
                          type="number"
                          min={0}
                          max={15}
                          value={settings.delayS}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              delayS: Math.max(0, Math.min(15, Number(e.target.value) || 0)),
                            }))
                          }
                          className="w-full bg-transparent text-xs font-mono tabular-nums text-right outline-none pr-1"
                        />
                        <span className="text-[11px] font-mono" style={{ color: palette.faint }}>s</span>
                      </div>
                    </div>
                  </div>

                  {/* 02 FREEWARE & IDENTITY */}
                  <div
                    className="rounded-xl border p-3.5 space-y-2.5"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                        <span style={{ color: accent }}>02</span> ACCESS &amp; IDENTITY
                      </span>
                      <span
                        className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold"
                        style={{ backgroundColor: palette.surface, color: palette.muted }}
                      >
                        FREE EDITION
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: palette.faint }}>
                      Completely free build — no license key required. Connected to{' '}
                      <span style={{ color: palette.text }}>
                        {discordInfo?.guildName || "Kinglock113's server"}
                      </span>
                      .
                    </p>
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: palette.faint }}>
                        App &amp; HUD brand name
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        value={settings.appName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings((s) => ({ ...s, appName: val }));
                          setHud((h) => ({
                            ...h,
                            modules: {
                              ...h.modules,
                              watermark: { ...h.modules.watermark, text: val || 'kinglock113.cc' },
                            },
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded-md border text-xs outline-none"
                        style={{
                          backgroundColor: palette.sidebar,
                          borderColor: palette.border,
                          color: palette.text,
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] mb-1" style={{ color: palette.faint }}>
                        Discord server invite URL
                      </label>
                      <input
                        type="url"
                        value={settings.discordInviteUrl}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, discordInviteUrl: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-md border text-xs font-mono outline-none"
                        style={{
                          backgroundColor: palette.sidebar,
                          borderColor: palette.border,
                          color: palette.text,
                        }}
                      />
                    </div>
                  </div>

                  {/* 03 SOUND */}
                  <div
                    className="rounded-xl border p-3.5 space-y-2.5"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5" style={{ color: accent }} />
                        <span>
                          <span style={{ color: accent }}>03</span> SOUND
                        </span>
                      </span>
                      <ToggleSwitch
                        checked={settings.soundEnabled}
                        accent={accent}
                        label="Enable sound cues"
                        onChange={(next) => setSettings((s) => ({ ...s, soundEnabled: next }))}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['soft', 'mechanical', 'arcade'] as SoundPack[]).map((pack) => {
                        const active = settings.soundPack === pack;
                        return (
                          <button
                            key={pack}
                            type="button"
                            onClick={() => {
                              setSettings((s) => ({ ...s, soundPack: pack }));
                              playMacroCue('start', pack, settings.soundVolume);
                            }}
                            className="py-1.5 rounded border text-[11px] font-medium capitalize cursor-pointer"
                            style={{
                              backgroundColor: active ? accent : palette.sidebar,
                              borderColor: active ? accent : palette.border,
                              color: active ? '#0c0c0d' : palette.text,
                            }}
                          >
                            {pack}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={10}
                        value={settings.soundVolume}
                        onChange={(e) => setSettings((s) => ({ ...s, soundVolume: Number(e.target.value) }))}
                        className="flex-1 accent-[#ff5a1f]"
                      />
                      <button
                        type="button"
                        onClick={() => playMacroCue('start', settings.soundPack, settings.soundVolume)}
                        className="px-2.5 py-1 rounded border text-[11px] cursor-pointer"
                        style={{ borderColor: palette.border, backgroundColor: palette.sidebar }}
                      >
                        Test
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* 04 APPEARANCE */}
                  <div
                    className="rounded-xl border p-3.5 space-y-3"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span style={{ color: accent }}>04</span> APPEARANCE
                    </div>
                    <div>
                      <div className="text-[11px] mb-1.5" style={{ color: palette.faint }}>Theme</div>
                      <div className="grid grid-cols-2 gap-2">
                        {(['graphite', 'carbon', 'stealth', 'light'] as AppTheme[]).map((t) => {
                          const selected = settings.theme === t;
                          const swatchBg =
                            t === 'graphite'
                              ? '#1d1d22'
                              : t === 'carbon'
                              ? 'repeating-linear-gradient(135deg, #161619 0px, #161619 3px, #25252b 3px, #25252b 6px)'
                              : t === 'stealth'
                              ? '#050507'
                              : '#f4f4f6';
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setSettings((s) => ({ ...s, theme: t }))}
                              className="px-3 py-2.5 rounded-lg border text-xs font-medium capitalize flex items-center gap-2.5 cursor-pointer transition-colors"
                              style={{
                                backgroundColor: selected ? palette.surface : palette.sidebar,
                                borderColor: selected ? accent : palette.border,
                              }}
                            >
                              <span
                                className="w-4 h-4 rounded border shrink-0"
                                style={{
                                  background: swatchBg,
                                  borderColor: 'rgba(255,255,255,0.18)',
                                }}
                              />
                              <span>{t}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] mb-1.5" style={{ color: palette.faint }}>Accent color</div>
                      <div className="flex items-center gap-2">
                        {ACCENT_SWATCHES.map((sw) => {
                          const activeSwatch = settings.accent === sw.color;
                          return (
                            <button
                              key={sw.color}
                              type="button"
                              onClick={() => setSettings((s) => ({ ...s, accent: sw.color }))}
                              title={sw.label}
                              className="w-7 h-7 rounded-md border-2 transition-transform hover:scale-105 cursor-pointer"
                              style={{
                                backgroundColor: sw.color,
                                borderColor: activeSwatch ? palette.text : 'transparent',
                                boxShadow: activeSwatch ? `0 0 0 1px ${sw.color}` : 'none',
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 05 BACKUP & WINDOWS APP */}
                  <div
                    className="rounded-xl border p-3.5 space-y-2.5"
                    style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  >
                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span style={{ color: accent }}>05</span> BACKUP
                    </div>
                    <p className="text-[11px]" style={{ color: palette.faint }}>
                      Save all profiles, HUD layout, settings and stats to a file, e.g. to move to a new PC.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={exportBackup}
                        className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        style={{ backgroundColor: accent, color: '#0c0c0d' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export backup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                        style={{ borderColor: palette.border, backgroundColor: palette.sidebar }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import backup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          downloadPersonalizedWindowsApp()
                            .then(() => showToast('Downloaded kinglock113-windows.zip'))
                            .catch(() => showToast('Download failed'));
                        }}
                        className="px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                        style={{ borderColor: palette.border, backgroundColor: palette.sidebar }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Windows .EXE</span>
                      </button>
                      <button
                        type="button"
                        onClick={resetAllDefaults}
                        className="px-3 py-1.5 rounded border text-xs font-medium cursor-pointer hover:bg-white/5"
                        style={{ borderColor: palette.border, color: palette.muted }}
                      >
                        Reset
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={importBackup}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What's New Modal */}
      <WhatsNewModal
        open={whatsNewOpen}
        onClose={() => setWhatsNewOpen(false)}
        appName={settings.appName}
        accent={accent}
        cardBg={palette.card}
        sidebarBg={palette.sidebar}
        borderColor={palette.border}
        textColor={palette.text}
        mutedColor={palette.muted}
      />

      {/* Click Test Modal */}
      {clickTestOpen && (
        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-xl border p-4 space-y-3"
            style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Click registration test</span>
              <button
                type="button"
                onClick={() => setClickTestOpen(false)}
                className="p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs" style={{ color: palette.muted }}>
              Tests <strong style={{ color: palette.text }}>{activeProfile.name}</strong> at{' '}
              <span className="font-mono">{activeProfile.cps}/s</span> with{' '}
              <span className="font-mono">{activeProfile.holdMs} ms</span> hold time.
            </p>
            <div
              className="rounded-lg border p-4 text-center"
              style={{ backgroundColor: palette.sidebar, borderColor: palette.border }}
            >
              <div className="font-mono tabular-nums text-3xl font-bold" style={{ color: accent }}>
                {ctCount}
                <span className="text-sm font-normal ml-1" style={{ color: palette.faint }}>
                  / {ctExpected || activeProfile.burstCount}
                </span>
              </div>
              <div className="text-[11px] mt-1" style={{ color: palette.faint }}>
                {ctDone
                  ? '100% registered · 0 dropped inputs'
                  : ctRunning
                  ? 'Firing test sequence...'
                  : 'Ready to measure'}
              </div>
            </div>
            <button
              type="button"
              disabled={ctRunning}
              onClick={runClickTest}
              className="w-full py-2 rounded-lg text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: accent, color: '#0c0c0d' }}
            >
              {ctRunning ? 'Running test...' : 'Run click test'}
            </button>
          </div>
        </div>
      )}

      {/* Import Share Code Modal */}
      {importModalOpen && (
        <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-xl border p-4 space-y-3"
            style={{ backgroundColor: palette.card, borderColor: palette.border, color: palette.text }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Import share code</span>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs" style={{ color: palette.muted }}>
              Paste a <code className="font-mono">KL1:</code> profile code from your Discord channel, or copy your active profile first.
            </p>
            <textarea
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="KL1:eyJuYW1lIjoiQ2xhc2gi..."
              className="w-full rounded-lg border p-2.5 text-xs font-mono outline-none"
              style={{ backgroundColor: palette.sidebar, borderColor: palette.border, color: palette.text }}
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={copyShareCode}
                className="px-3 py-1.5 rounded border text-xs flex items-center gap-1.5 cursor-pointer"
                style={{ borderColor: palette.border }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy current</span>
              </button>
              <button
                type="button"
                onClick={handleImportCode}
                className="px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
                style={{ backgroundColor: accent, color: '#0c0c0d' }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="absolute bottom-3 right-3 z-40 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-lg flex items-center gap-1.5"
          style={{ backgroundColor: palette.surface, borderColor: accent, color: palette.text }}
        >
          <Activity className="w-3.5 h-3.5" style={{ color: accent }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
