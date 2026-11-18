import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { BladeLogo } from './BladeLogo';

type HudModuleId = 'watermark' | 'status' | 'profiles' | 'stats' | 'keys' | 'graph' | 'dot';

const HUD_MODULES: { id: HudModuleId; label: string; desc: string }[] = [
  { id: 'watermark', label: 'Watermark with your name', desc: 'Corner brand, clock, and ping' },
  { id: 'status', label: 'Status & live rate', desc: 'Active profile and real-time inputs/s' },
  { id: 'profiles', label: 'Profile list', desc: 'Live hotkey quick-reference' },
  { id: 'stats', label: 'Session stats', desc: 'Elapsed time, today count, clashes' },
  { id: 'keys', label: 'Live keys', desc: 'Animated pressed-key visualizer' },
  { id: 'graph', label: 'Rate graph', desc: 'Compact 10-second sparkline' },
  { id: 'dot', label: 'Center dot', desc: 'High-contrast reticle anchor' },
];

interface HudShowcaseSectionProps {
  brandName?: string;
}

export const HudShowcaseSection: React.FC<HudShowcaseSectionProps> = ({
  brandName = 'kinglock113.cc',
}) => {
  const [enabled, setEnabled] = useState<Record<HudModuleId, boolean>>({
    watermark: true,
    status: true,
    profiles: true,
    stats: true,
    keys: true,
    graph: true,
    dot: true,
  });
  const [liveRate, setLiveRate] = useState(240);

  useEffect(() => {
    const id = setInterval(() => {
      setLiveRate(Math.round(238 + Math.random() * 4));
    }, 450);
    return () => clearInterval(id);
  }, []);

  const toggleMod = (id: HudModuleId) => {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="hud" className="py-24 border-t border-white/[0.06]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-xl mb-12">
          <div className="text-xs font-mono text-[#ff5a1f] mb-2">03. In-game HUD</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            Your stats, right on screen
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#a0a0a8]">
            A click-through overlay that never steals focus or blocks clicks. Seven modules, five screen anchors, and automatic hide on alt-tab.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Interactive Simulated Game Screen */}
          <div
            className="lg:col-span-8 relative min-h-[380px] rounded-2xl border border-white/[0.08] overflow-hidden p-5 select-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 42%, #1e2028 0%, #121318 58%, #0b0b0e 100%)',
            }}
          >
            {/* Subtle simulated arena grid lines */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            {/* Top Left Zone */}
            <div className="relative z-10 flex flex-col items-start gap-2">
              {enabled.watermark && (
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#0c0c0d]/85 border border-white/[0.1] backdrop-blur-sm">
                  <BladeLogo className="w-3.5 h-3.5" showFrame={false} />
                  <span className="font-display text-xs font-bold tracking-wider text-white uppercase">
                    {brandName}
                  </span>
                  <span className="font-mono text-[11px] text-[#8b8b94] tabular-nums">
                    18:42 · v0.9 · ~18ms
                  </span>
                </div>
              )}

              {enabled.status && (
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#0c0c0d]/85 border border-white/[0.1] backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a1f]" />
                  <span className="font-display text-xs font-semibold tracking-wide text-white">
                    CLASH
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[#ededee]">{liveRate}/s</span>
                </div>
              )}
            </div>

            {/* Top Right Zone */}
            <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-2">
              {enabled.profiles && (
                <div className="px-3 py-2 rounded-md bg-[#0c0c0d]/85 border border-white/[0.1] backdrop-blur-sm space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-4 text-[#8b8b94]">
                    <span>Auto Click</span>
                    <span className="font-mono text-[10px]">Mouse 4</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-white font-medium">
                    <span>Clash</span>
                    <span className="font-mono text-[10px] text-[#ff5a1f]">Mouse 5</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[#8b8b94]">
                    <span>Slashes of Fury</span>
                    <span className="font-mono text-[10px]">Mouse 3</span>
                  </div>
                </div>
              )}

              {enabled.stats && (
                <div className="px-3 py-2 rounded-md bg-[#0c0c0d]/85 border border-white/[0.1] backdrop-blur-sm min-w-[155px] text-xs space-y-1">
                  <div className="text-[10px] font-mono tracking-wider text-[#8b8b94]">SESSION</div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#8b8b94]">Time</span>
                    <span className="font-mono tabular-nums text-white">04:12</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#8b8b94]">Today</span>
                    <span className="font-mono tabular-nums text-white">38.4k</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#8b8b94]">Clashes</span>
                    <span className="font-mono tabular-nums text-white">87</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Left Zone */}
            <div className="absolute bottom-5 left-5 z-10 flex items-end gap-2.5">
              {enabled.keys && (
                <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-[#0c0c0d]/85 border border-white/[0.1]">
                  <span className="hud-key-hit-1 min-w-[32px] h-7 px-2 grid place-items-center rounded border border-b-2 font-mono text-xs font-semibold">
                    F
                  </span>
                  <span className="hud-key-hit-2 min-w-[32px] h-7 px-2 grid place-items-center rounded border border-b-2 font-mono text-xs font-semibold">
                    E
                  </span>
                  <span className="hud-key-hit-3 min-w-[40px] h-7 px-2 grid place-items-center rounded border border-b-2 font-mono text-xs font-semibold">
                    LMB
                  </span>
                </div>
              )}

              {enabled.graph && (
                <div className="px-2.5 py-1.5 rounded-md bg-[#0c0c0d]/85 border border-white/[0.1] w-32">
                  <svg viewBox="0 0 120 26" className="w-full h-6">
                    <path
                      d="M0,22 L12,22 L18,6 L28,6 L34,20 L48,20 L54,5 L72,5 L78,22 L90,22 L96,6 L112,6 L120,20"
                      fill="none"
                      stroke="#ff5a1f"
                      strokeWidth="1.75"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Center Dot */}
            {enabled.dot && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#ff5a1f] ring-2 ring-black/60" />
            )}

            <div className="absolute bottom-4 right-5 text-[11px] font-mono text-[#63636b]">
              Click modules on the right to preview
            </div>
          </div>

          {/* Interactive Module Toggle List */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-2">
            {HUD_MODULES.map((mod) => {
              const isOn = enabled[mod.id];
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => toggleMod(mod.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isOn
                      ? 'bg-[#151519] border-white/[0.14] text-white'
                      : 'bg-[#111114] border-white/[0.06] text-[#75757d] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{mod.label}</div>
                    <div className="text-xs text-[#6f6f78] truncate">{mod.desc}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      isOn
                        ? 'bg-[#ff5a1f] border-[#ff5a1f] text-[#0c0c0d]'
                        : 'bg-transparent border-white/[0.15] text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
