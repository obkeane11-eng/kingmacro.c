import React, { useState } from 'react';
import { BarChart3, Clock, Keyboard, Layers, Share2, Shield, Zap } from 'lucide-react';

const PROFILE_PREVIEWS = [
  {
    name: 'Clash',
    meta: 'Hold · 240/s',
    hotkey: 'Mouse 5',
    detail: 'Spams F at 4.17 ms intervals the instant Mouse 5 goes down, stopping the microsecond you release.',
  },
  {
    name: 'Slashes of Fury',
    meta: 'Burst · 35×',
    hotkey: 'Mouse 3',
    detail: 'Fires exactly 35 timed left-clicks at 40/s with 5 ms hold duration so every strike registers cleanly.',
  },
  {
    name: 'Auto Click',
    meta: 'Toggle · 144/s',
    hotkey: 'F6',
    detail: 'Locks to your display refresh cadence with zero timer drift. Press once to arm, once to disarm.',
  },
];

export const FeaturesSection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = PROFILE_PREVIEWS[activeIdx];

  return (
    <section id="features" className="py-24 border-t border-white/[0.06]">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="max-w-xl mb-12">
          <div className="text-xs font-mono text-[#ff5a1f] mb-2">01. Features</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            A hotkey for every kind of press
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#a0a0a8]">
            One hotkey away from a perfect clash. Everything else stays out of your way.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Featured Marquee Card (col-span-2) */}
          <article className="md:col-span-2 rounded-2xl bg-[#131316] border border-white/[0.08] p-7 flex flex-col justify-between gap-6">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#1c1c21] border border-white/[0.08] flex items-center justify-center text-[#ff5a1f] mb-5">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white">
                Profiles with their own hotkeys
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8] max-w-2xl">
                As many profiles as you need, each with its own inputs, speed, activation mode, and hotkey. All hotkeys remain live simultaneously, including Mouse 3, 4, and 5.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PROFILE_PREVIEWS.map((item, idx) => {
                  const active = idx === activeIdx;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1b1b20] border-[#ff5a1f]/70'
                          : 'bg-[#0e0e10] border-white/[0.07] hover:border-white/[0.16]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white truncate">{item.name}</span>
                        <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#18181c] border border-white/[0.12] text-[#ededee] shrink-0">
                          {item.hotkey}
                        </kbd>
                      </div>
                      <div className="mt-1.5 text-xs font-mono text-[#8b8b94]">{item.meta}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#8b8b94] leading-relaxed px-1">{current.detail}</p>
            </div>
          </article>

          {/* Hold, burst or toggle */}
          <article className="rounded-2xl bg-[#131316] border border-white/[0.08] p-7">
            <div className="w-9 h-9 rounded-lg bg-[#1c1c21] border border-white/[0.08] flex items-center justify-center text-[#ff5a1f] mb-5">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white">Hold, burst, or toggle</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8]">
              Fire only while a key is held, trigger an exact number of cycles per press, or toggle continuous output on and off.
            </p>
          </article>

          {/* Microsecond timing */}
          <article className="rounded-2xl bg-[#131316] border border-white/[0.08] p-7">
            <div className="w-9 h-9 rounded-lg bg-[#1c1c21] border border-white/[0.08] flex items-center justify-center text-[#ff5a1f] mb-5">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white">Microsecond timing</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8]">
              High-resolution multimedia timer with fixed deadlines. No cumulative drift and no 15 ms <code className="font-mono text-xs text-[#ededee]">Sleep()</code> hiccups.
            </p>
          </article>

          {/* Turbo keys */}
          <article className="rounded-2xl bg-[#131316] border border-white/[0.08] p-7">
            <div className="w-9 h-9 rounded-lg bg-[#1c1c21] border border-white/[0.08] flex items-center justify-center text-[#ff5a1f] mb-5">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white">Turbo keys</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8]">
              Hold <kbd className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#1c1c21] border border-white/[0.12] text-[#ededee]">F</kbd> and kinglock113.cc fires F on repeat. Physical presses and injected inputs stay cleanly isolated.
            </p>
          </article>

          {/* Roblox only */}
          <article className="rounded-2xl bg-[#131316] border border-white/[0.08] p-7">
            <div className="w-9 h-9 rounded-lg bg-[#1c1c21] border border-white/[0.08] flex items-center justify-center text-[#ff5a1f] mb-5">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white">Roblox window guard</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8]">
              Hotkeys and outputs only activate while Roblox is focused. Alt-tab out and the engine pauses instantaneously.
            </p>
          </article>

          {/* Share codes & backups */}
          <article className="rounded-2xl bg-[#131316] border border-white/[0.08] p-7">
            <div className="w-9 h-9 rounded-lg bg-[#1c1c21] border border-white/[0.08] flex items-center justify-center text-[#ff5a1f] mb-5">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white">Share codes & backups</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8]">
              Copy any profile as a compact share string for teammates, or export your entire configuration to JSON.
            </p>
          </article>

          {/* Stats & achievements */}
          <article className="md:col-span-2 lg:col-span-2 rounded-2xl bg-[#131316] border border-white/[0.08] p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#1c1c21] border border-white/[0.08] flex items-center justify-center text-[#ff5a1f] mb-5">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">Session telemetry & achievements</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8] max-w-lg">
                Track 7-day input volume, clash counts, peak output rate, and unlock nine performance milestones directly inside the app.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-4 sm:pt-0 sm:pl-6">
              <div>
                <div className="font-mono tabular-nums text-xl font-semibold text-white">7 days</div>
                <div className="text-xs text-[#8b8b94] mt-0.5">History log</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-xl font-semibold text-white">9</div>
                <div className="text-xs text-[#8b8b94] mt-0.5">Milestones</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-xl font-semibold text-[#ff5a1f]">0.6%</div>
                <div className="text-xs text-[#8b8b94] mt-0.5">Idle CPU</div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
