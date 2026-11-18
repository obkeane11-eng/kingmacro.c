import {
  DEFAULT_HUD,
  DEFAULT_PROFILES,
  DEFAULT_SETTINGS,
  type AppSettings,
  type HudConfig,
  type MacroProfile,
} from '../types/bladeturbo';

const STORAGE_KEY = 'kinglock113.cc.workspace.v1';

interface SavedWorkspace {
  profiles?: MacroProfile[];
  hud?: HudConfig;
  settings?: AppSettings;
}

export async function downloadPersonalizedWindowsApp(): Promise<void> {
  let saved: SavedWorkspace = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw) as SavedWorkspace;
  } catch {
    saved = {};
  }

  const settings = { ...DEFAULT_SETTINGS, ...(saved.settings || {}) };
  const hud = { ...DEFAULT_HUD, ...(saved.hud || {}) };
  const profiles =
    Array.isArray(saved.profiles) && saved.profiles.length > 0
      ? saved.profiles
      : DEFAULT_PROFILES;

  const payload = {
    appName: settings.appName || 'kinglock113.cc',
    accent: settings.accent || '#ff5a1f',
    robloxOnly: settings.robloxOnly,
    hudEnabled: hud.enabled,
    hudOnlyRoblox: hud.onlyRoblox,
    hudCenterDot: hud.modules.crosshair.on,
    hudOpacity: hud.opacity,
    delayS: settings.delayS,
    discordInviteUrl: settings.discordInviteUrl,
    discordWebhookUrl: settings.discordWebhookUrl || '',
    selectedIndex: 0,
    profiles: profiles.map((p) => ({
      name: p.name,
      mode: p.mode,
      cps: p.cps,
      unlimited: p.unlimited,
      holdMs: p.holdMs,
      burstCount: p.burstCount,
      hotkeyVk: p.hotkey.vk,
      hotkeyLabel: p.hotkey.label,
      actions: p.actions.map((a) =>
        a.kind === 'key'
          ? { kind: 'key' as const, vk: a.vk, label: a.label, enabled: a.enabled }
          : { kind: 'mouse' as const, button: a.button, enabled: a.enabled }
      ),
    })),
  };

  const res = await fetch('/api/download/windows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kinglock113-windows.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
