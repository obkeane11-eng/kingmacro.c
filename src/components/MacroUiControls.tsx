import React from 'react';
import {
  BarChart3,
  Clock,
  Crown,
  Gauge,
  Gem,
  Hash,
  Layers,
  Play,
  Shield,
  X,
} from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  accent: string;
  label?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  accent,
  label,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center w-9 h-5 rounded-md transition-colors duration-150 shrink-0 cursor-pointer focus:outline-none"
      style={{
        backgroundColor: checked ? accent : '#34343c',
      }}
    >
      <span
        className="inline-block w-3.5 h-3.5 rounded-sm bg-[#101014] shadow transition-transform duration-150"
        style={{
          transform: checked ? 'translateX(19px)' : 'translateX(3px)',
        }}
      />
    </button>
  );
};

interface StartDialButtonProps {
  running: boolean;
  countdown: number | null;
  hotkeyLabel: string;
  accent: string;
  surfaceColor: string;
  borderColor: string;
  textColor: string;
  faintColor: string;
  onClick: () => void;
}

export const StartDialButton: React.FC<StartDialButtonProps> = ({
  running,
  countdown,
  hotkeyLabel,
  accent,
  surfaceColor,
  borderColor,
  textColor,
  faintColor,
  onClick,
}) => {
  const ticks = Array.from({ length: 40 });
  const isCounting = countdown !== null && countdown > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-32 h-32 shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer group"
      aria-label={running ? 'Stop macro' : isCounting ? 'Cancel countdown' : 'Start macro'}
    >
      {/* Radial segmented tick ring matching desktop dial */}
      <svg
        viewBox="0 0 128 128"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        {ticks.map((_, i) => {
          const angle = (i / ticks.length) * 360;
          const activeTick = running || (isCounting && i % 2 === 0);
          return (
            <line
              key={i}
              x1="64"
              y1="4"
              x2="64"
              y2="9"
              stroke={activeTick ? accent : borderColor}
              strokeWidth={activeTick ? '2' : '1.5'}
              strokeLinecap="round"
              transform={`rotate(${angle} 64 64)`}
              opacity={activeTick ? 0.95 : 0.7}
            />
          );
        })}
      </svg>

      {/* Inner core button */}
      <div
        className="w-24 h-24 rounded-full flex flex-col items-center justify-center border transition-all duration-150"
        style={{
          backgroundColor: running ? accent : surfaceColor,
          color: running ? '#0c0c0d' : textColor,
          borderColor: running || isCounting ? accent : borderColor,
          boxShadow: running ? `0 0 28px ${accent}40` : 'none',
        }}
      >
        <span className="font-display text-sm font-bold tracking-wider">
          {isCounting ? `${countdown}s` : running ? 'STOP' : 'START'}
        </span>
        <span
          className="text-[10px] font-mono mt-0.5"
          style={{ color: running ? '#0c0c0d' : faintColor }}
        >
          {isCounting ? 'click to cancel' : `or ${hotkeyLabel}`}
        </span>
      </div>
    </button>
  );
};

export const ACHIEVEMENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  first: Play,
  k100: Hash,
  m1: Gem,
  m10: Crown,
  clash: Shield,
  speed: Gauge,
  marathon: Clock,
  bench: BarChart3,
  collector: Layers,
};

interface WhatsNewModalProps {
  open: boolean;
  onClose: () => void;
  appName: string;
  accent: string;
  cardBg: string;
  sidebarBg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  open,
  onClose,
  appName,
  accent,
  cardBg,
  sidebarBg,
  borderColor,
  textColor,
  mutedColor,
}) => {
  if (!open) return null;

  const items = [
    {
      tag: 'v0.9.0',
      title: 'Native Windows In-Game Export',
      desc: 'Export a standalone Windows package preloaded with your profiles, hotkeys, HUD layout, and Discord bridge.',
    },
    {
      tag: 'HUD',
      title: 'Full 5-Anchor Overlay & Sub-Toggles',
      desc: 'Place Watermark, Status, Profile List, Session Stats, Live Keys, and Rate Graph across TL / TC / TR / BL / BR.',
    },
    {
      tag: 'TIMING',
      title: 'Start Delay & Hotkey Conflict Detection',
      desc: 'Set a countdown delay for manual starts and catch overlapping profile hotkeys immediately.',
    },
    {
      tag: 'DISCORD',
      title: 'Freeware Edition + Server Webhook Sync',
      desc: '100% free with zero license restrictions and one-click profile/stats posting to Kinglock113’s server.',
    },
  ];

  return (
    <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-xl border p-4 space-y-3"
        style={{ backgroundColor: cardBg, borderColor, color: textColor }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-display text-sm font-semibold">
              What&apos;s new in {appName || 'kinglock113.cc'}
            </span>
            <p className="text-[11px]" style={{ color: mutedColor }}>
              Release highlights & recent builds
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto bt-scroll pr-1">
          {items.map((item) => (
            <div
              key={item.title}
              className="p-2.5 rounded-lg border space-y-1"
              style={{ backgroundColor: sidebarBg, borderColor }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${accent}22`, color: accent }}
                >
                  {item.tag}
                </span>
                <span className="text-xs font-semibold">{item.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg text-xs font-semibold cursor-pointer"
          style={{ backgroundColor: accent, color: '#0c0c0d' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};
