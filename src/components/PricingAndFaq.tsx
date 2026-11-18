import React, { useState } from 'react';
import { Check, ChevronDown, ExternalLink } from 'lucide-react';
import { DISCORD_INVITE_URL, type DiscordInviteInfo } from '../types/bladeturbo';
import { BladeLogo } from './BladeLogo';

interface PricingAndFaqProps {
  brandName: string;
  discordInviteUrl: string;
  discordInfo: DiscordInviteInfo | null;
  onOpenGetModal: () => void;
}

const FAQ_ITEMS = [
  {
    q: 'Is this a cheat or a memory exploit?',
    a: 'No. This is an external input macro that dispatches standard Windows key and mouse events through SendInput, similar to programmable mouse software. It never injects into, reads from, or modifies any game process. Always verify the rules of the specific game you play.',
  },
  {
    q: 'Why does Windows SmartScreen show a warning on install?',
    a: 'Independent binaries without an EV code-signing certificate trigger Windows SmartScreen until enough users install them. Select "More info" followed by "Run anyway", or verify the SHA-256 hash published in the Discord server.',
  },
  {
    q: 'Which input rate should I pick?',
    a: 'Match your in-game frame rate (typically 144/s or 240/s). Games sample input once per rendered frame, so running dramatically above your frame rate yields minimal extra benefit. Burst profiles show exact duration so you can tune hold time cleanly.',
  },
  {
    q: 'Does it work on macOS or mobile?',
    a: 'The native desktop binary relies on Windows low-level input hooks and high-resolution multimedia timers for Windows 10 and Windows 11 (64-bit), while this web workspace lets you configure profiles, share codes, and post directly to Discord from anywhere.',
  },
  {
    q: 'Can I transfer my profiles to a new PC?',
    a: 'Yes. Open Settings → Backup & Reset to export all profiles, HUD positions, appearance settings, and stats into a single JSON file, or share individual BT1 profile codes straight to your Discord server.',
  },
];

export const PricingAndFaq: React.FC<PricingAndFaqProps> = ({
  brandName,
  discordInviteUrl,
  discordInfo,
  onOpenGetModal,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const inviteHref = discordInviteUrl || DISCORD_INVITE_URL;
  const serverName = discordInfo?.guildName || "Kinglock113's server";

  return (
    <>
      {/* 04. Setup */}
      <section className="py-24 border-t border-white/[0.06] bg-[#101013]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-xl mb-12">
            <div className="text-xs font-mono text-[#ff5a1f] mb-2">04. Setup</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Ready in under a minute
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'Download & extract',
                desc: 'Download kinglock113-windows.zip with your saved profiles and run Launch_Kinglock113.bat.',
              },
              {
                step: '02',
                title: 'Open in-game',
                desc: `Launches kinglock113.exe natively on Windows with global hotkeys, SendInput, and Discord sync to ${serverName}.`,
              },
              {
                step: '03',
                title: 'Play',
                desc: 'Hold Mouse 5 or press your profile hotkey in Roblox. The click-through HUD tracks live rate.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-[#131316] border border-white/[0.08] p-7"
              >
                <div className="font-mono text-xs text-[#6f6f78]">{item.step}</div>
                <h3 className="font-display text-xl font-semibold text-white mt-3">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#a0a0a8]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05. Download & Discord Server */}
      <section id="download" className="py-24 border-t border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="max-w-xl mx-auto text-center mb-12">
            <div className="text-xs font-mono text-[#ff5a1f] mb-2">05. Download & Community</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Completely free, built to run in-game
            </h2>
          </div>

          <div className="max-w-[820px] mx-auto rounded-2xl bg-[#131316] border border-white/[0.12] p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="font-mono text-xs text-[#8b8b94]">{serverName} · Windows 10 & 11</div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-5xl font-bold tracking-tight text-white">
                  Free
                </span>
                <span className="text-sm text-[#8b8b94]">native Windows app</span>
              </div>

              <button
                type="button"
                onClick={onOpenGetModal}
                className="mt-7 w-full py-3 px-6 rounded-xl bg-[#ff5a1f] hover:bg-[#ff6d38] text-[#0c0c0d] font-semibold text-sm transition-colors cursor-pointer"
              >
                Download for Windows (.zip)
              </button>

              <p className="mt-3 text-xs text-[#6f6f78] flex items-center justify-between gap-2">
                <span className="truncate">
                  {discordInfo?.onlineCount !== null && discordInfo?.onlineCount !== undefined
                    ? `${discordInfo.onlineCount} online · ${discordInfo.memberCount ?? 0} members`
                    : 'Includes kinglock113.exe builder'}
                </span>
                <a
                  href={inviteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#a0a0a8] hover:text-white inline-flex items-center gap-1 shrink-0"
                >
                  <span>Join Discord</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <ul className="space-y-3 text-sm text-[#d4d4d8]">
              {[
                'Real Win32 SendInput + Stopwatch deadline engine',
                'Hold, Burst (35×), Toggle & Mouse 3/4/5 hotkeys',
                'Click-through always-on-top in-game HUD overlay',
                'Roblox window focus guard + built-in benchmark',
                `Preloads your web config & connects to ${serverName}`,
              ].map((line) => (
                <li key={line} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#ff5a1f] shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 06. FAQ */}
      <section id="faq" className="py-24 border-t border-white/[0.06] bg-[#101013]">
        <div className="max-w-[760px] mx-auto px-6">
          <div className="mb-10">
            <div className="text-xs font-mono text-[#ff5a1f] mb-2">06. FAQ</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Before you install
            </h2>
          </div>

          <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-base font-medium text-white group-hover:text-[#ff5a1f] transition-colors">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8b8b94] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#ff5a1f]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-5 text-sm leading-relaxed text-[#a0a0a8]">{item.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-[1160px] mx-auto px-6 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white [text-wrap:balance]">
            Stop mashing, start timing
          </h2>
          <p className="mt-3 text-sm text-[#8b8b94]">
            Customize your profiles above or hop straight into {serverName}.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenGetModal}
              className="px-6 py-3 rounded-xl bg-[#ff5a1f] hover:bg-[#ff6d38] text-[#0c0c0d] font-semibold text-sm transition-colors cursor-pointer"
            >
              Download Free
            </button>
            <a
              href={inviteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl border border-white/[0.12] hover:border-white/[0.25] text-sm font-medium text-[#ededee] transition-colors"
            >
              Join Discord
            </a>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="py-10 border-t border-white/[0.06] bg-[#0a0a0b]">
        <div className="max-w-[1160px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <BladeLogo className="w-5 h-5" showFrame={false} />
            <span className="font-display text-xs font-bold tracking-wider text-white uppercase">
              {brandName}
            </span>
          </div>

          <p className="text-xs text-[#6f6f78] max-w-xl leading-relaxed">
            Personal input macro workspace connected to {serverName}. Independent software tool not affiliated with or endorsed by Roblox Corporation or any game developer.
          </p>

          <div className="font-mono text-xs text-[#6f6f78] shrink-0">
            © {new Date().getFullYear()} {brandName}
          </div>
        </div>
      </footer>
    </>
  );
};
