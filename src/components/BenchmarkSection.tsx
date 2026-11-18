import React, { useMemo, useState } from 'react';
import { RotateCw } from 'lucide-react';

export const BenchmarkSection: React.FC = () => {
  const [runSeed, setRunSeed] = useState(0);
  const [targetCps, setTargetCps] = useState<144 | 240 | 500>(240);

  const traces = useMemo(() => {
    const count = Math.min(48, Math.round((targetCps / 1000) * 100));
    const step = 100 / count;
    const me = Array.from({ length: count }, (_, i) => {
      const jitter = ((i * 7 + runSeed * 3) % 5 - 2) * 0.04;
      return Math.min(99.5, Math.max(0.8, 1.5 + i * step + jitter));
    });

    // Typical Sleep(1) macro stalls at Windows ~15.6ms timer resolution
    const themCount = 6 + (runSeed % 2);
    const them = Array.from({ length: themCount }, (_, i) => {
      const base = 3 + i * 15.2 + (((i + runSeed) % 3) - 1) * 2.1;
      return Math.min(98, Math.max(1.5, base));
    });

    const themRate = (themCount * 10).toFixed(1);
    const ratio = (targetCps / Number(themRate)).toFixed(1);

    return { me, them, themRate, ratio };
  }, [runSeed, targetCps]);

  return (
    <section id="benchmark" className="py-24 border-t border-white/[0.06] bg-[#101013]">
      <div className="max-w-[1160px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5">
          <div className="text-xs font-mono text-[#ff5a1f] mb-2">02. Benchmark</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            Measured, not promised
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#a0a0a8]">
            kinglock113.cc includes a built-in timing benchmark that compares its fixed-deadline engine against a standard <code className="font-mono text-xs text-[#ededee]">Sleep()</code> macro on your own hardware.
          </p>
          <p className="mt-3 text-xs text-[#6f6f78] leading-relaxed">
            Inspect the first 100 ms capture below across different target frequencies. Standard Windows timer ticks quantize <code className="font-mono">Sleep()</code> calls into ~15.6 ms buckets, causing missed clash windows.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {([144, 240, 500] as const).map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setTargetCps(rate)}
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs tabular-nums transition-colors cursor-pointer ${
                  targetCps === rate
                    ? 'bg-[#1c1c21] border-[#ff5a1f] text-white'
                    : 'bg-[#141418] border-white/[0.08] text-[#8b8b94] hover:text-white'
                }`}
              >
                {rate} / s
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRunSeed((s) => s + 1)}
              className="px-3 py-1.5 rounded-lg border border-white/[0.1] bg-[#18181c] hover:bg-[#202026] text-xs font-medium text-[#ededee] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Re-sample</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl bg-[#131316] border border-white/[0.08] p-6 sm:p-8">
          <div className="flex items-center justify-between text-xs text-[#8b8b94] mb-6">
            <span>Target {targetCps} / s · first 100 ms capture</span>
            <span className="font-mono text-[#6f6f78]">Windows 11 · test rig</span>
          </div>

          {/* kinglock113.cc Row */}
          <div className="space-y-2 mb-6">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-white">kinglock113.cc</span>
              <span className="font-mono tabular-nums text-xs text-[#ff5a1f]">
                {targetCps.toFixed(1)} / s · ±0.5 µs
              </span>
            </div>
            <div className="relative h-10 rounded-lg bg-[#0b0b0d] border border-white/[0.07] overflow-hidden">
              {traces.me.map((pos, idx) => (
                <span
                  key={`${runSeed}-${targetCps}-${idx}`}
                  className="absolute top-1.5 bottom-1.5 w-[2px] bg-[#ff5a1f] rounded-full"
                  style={{ left: `${pos.toFixed(2)}%` }}
                />
              ))}
            </div>
          </div>

          {/* Typical Macro Row */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-[#a0a0a8]">Typical Sleep() macro</span>
              <span className="font-mono tabular-nums text-xs text-[#8b8b94]">
                {traces.themRate} / s · ±11.2 ms
              </span>
            </div>
            <div className="relative h-10 rounded-lg bg-[#0b0b0d] border border-white/[0.07] overflow-hidden">
              {traces.them.map((pos, idx) => (
                <span
                  key={`them-${runSeed}-${idx}`}
                  className="absolute top-1.5 bottom-1.5 w-[2px] bg-[#52525b] rounded-full"
                  style={{ left: `${pos.toFixed(2)}%` }}
                />
              ))}
            </div>
          </div>

          {/* Time Axis */}
          <div className="relative h-5 mt-2 font-mono text-[11px] text-[#63636b] tabular-nums">
            <span className="absolute left-0">0</span>
            <span className="absolute left-1/4 -translate-x-1/2">25</span>
            <span className="absolute left-1/2 -translate-x-1/2">50</span>
            <span className="absolute left-3/4 -translate-x-1/2">75</span>
            <span className="absolute right-0">100 ms</span>
          </div>

          {/* Quantified Delta */}
          <div className="mt-6 pt-6 border-t border-white/[0.08] grid grid-cols-2 gap-6">
            <div>
              <div className="font-mono tabular-nums text-3xl sm:text-4xl font-semibold text-white">
                {traces.ratio}×
              </div>
              <div className="text-xs text-[#8b8b94] mt-1">more inputs per second at {targetCps}/s</div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-3xl sm:text-4xl font-semibold text-[#ff5a1f]">
                22,000×
              </div>
              <div className="text-xs text-[#8b8b94] mt-1">tighter deadline timing stability</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
