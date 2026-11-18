import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, ExternalLink, Menu, RefreshCw, X } from 'lucide-react';
import { BenchmarkSection } from './components/BenchmarkSection';
import { BladeLogo } from './components/BladeLogo';
import { BladeTurboApp } from './components/BladeTurboApp';
import { FeaturesSection } from './components/FeaturesSection';
import { HudShowcaseSection } from './components/HudShowcaseSection';
import { PricingAndFaq } from './components/PricingAndFaq';
import { useDiscordInvite } from './hooks/useDiscordInvite';
import { DISCORD_INVITE_URL } from './types/bladeturbo';
import { downloadPersonalizedWindowsApp } from './utils/downloadWindowsApp';

export function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoExpanded, setDemoExpanded] = useState(false);
  const [getModalOpen, setGetModalOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [downloadingWin, setDownloadingWin] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const [brandName, setBrandName] = useState('kinglock113.cc');
  const [discordInviteUrl, setDiscordInviteUrl] = useState(DISCORD_INVITE_URL);

  const { info: discordInfo, loading: discordLoading, refresh: refreshDiscord } =
    useDiscordInvite(discordInviteUrl);

  const handleBrandChange = useCallback((nextName: string, nextInvite: string) => {
    setBrandName(nextName.trim() || 'kinglock113.cc');
    setDiscordInviteUrl(nextInvite.trim() || DISCORD_INVITE_URL);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = waitlistEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setWaitlistError('Please enter a valid email address.');
      return;
    }
    setWaitlistError('');
    setWaitlistSubmitted(true);
  };

  const handleDownloadWindows = async () => {
    setDownloadingWin(true);
    setDownloadError('');
    try {
      await downloadPersonalizedWindowsApp();
      setDownloadDone(true);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingWin(false);
    }
  };

  const serverLabel = discordInfo?.guildName || "Kinglock113's server";

  return (
    <div id="top" className="min-h-screen bg-[#0c0c0d] text-[#ededee]">
      {/* Top Navigation Bar — 3-Zone Contract */}
      <header
        className={`sticky top-0 z-40 transition-colors duration-200 border-b ${
          scrolled
            ? 'bg-[#0c0c0d]/90 backdrop-blur-md border-white/[0.08]'
            : 'bg-[#0c0c0d]/60 backdrop-blur-sm border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a1f] rounded"
          >
            <BladeLogo className="w-6 h-6" />
            <span className="font-display text-sm font-bold tracking-wider text-white uppercase">
              {brandName}
            </span>
          </a>

          {/* Zone 2: 5 Single-Line Text Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#a0a0a8]">
            <a
              href="#features"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#benchmark"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Benchmark
            </a>
            <a
              href="#hud"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              HUD
            </a>
            <a
              href="#download"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Download
            </a>
            <a
              href="#faq"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              FAQ
            </a>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Join Discord
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg border border-white/[0.1] text-[#ededee] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-[#0c0c0d] px-6 py-4 space-y-3">
            <div className="flex flex-col space-y-2.5 text-sm font-medium text-[#a0a0a8]">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">
                Features
              </a>
              <a href="#benchmark" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">
                Benchmark
              </a>
              <a href="#hud" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">
                HUD
              </a>
              <a href="#download" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">
                Download
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">
                FAQ
              </a>
            </div>
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-lg bg-[#5865f2] text-white text-xs font-semibold block text-center"
            >
              Join Discord
            </a>
          </div>
        )}
      </header>

      <main>
        {/* Hero Split with Interactive Live Personal Macro App */}
        <section className="pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            <div className="lg:col-span-5">
              <div className="text-xs font-mono text-[#8b8b94] mb-4">
                {brandName} · Windows 10 / 11 · 100% Free
              </div>
              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.05] [text-wrap:balance]"
                style={{ fontSize: 'clamp(2.35rem, 4.2vw, 3.75rem)' }}
              >
                Every input, <span className="text-[#ff5a1f]">exactly</span> on time
              </h1>
              <p className="mt-5 text-[16px] leading-relaxed text-[#a0a0a8] max-w-md">
                Precision input macro and workspace for {brandName}. Customize profiles, hotkeys, and HUD overlays, connected directly to {serverLabel}.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setWaitlistSubmitted(false);
                    setGetModalOpen(true);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#ff5a1f] hover:bg-[#ff6d38] text-[#0c0c0d] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Download Free
                </button>
                <button
                  type="button"
                  onClick={() => setDemoExpanded(true)}
                  className="px-5 py-3 rounded-xl border border-white/[0.12] hover:border-white/[0.25] text-sm font-medium text-[#ededee] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open full workspace
                </button>
              </div>

              {/* Live Connected Discord Server Card */}
              <div className="mt-6 rounded-xl bg-[#131316] border border-white/[0.08] p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{serverLabel}</div>
                  <div className="text-[11px] font-mono text-[#8b8b94] mt-0.5 truncate">
                    #{discordInfo?.channelName || 'general'}
                    {discordInfo?.onlineCount !== null && discordInfo?.onlineCount !== undefined
                      ? ` · ${discordInfo.onlineCount} online`
                      : ''}
                    {discordInfo?.memberCount !== null && discordInfo?.memberCount !== undefined
                      ? ` · ${discordInfo.memberCount} members`
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={refreshDiscord}
                    title="Refresh Discord server status"
                    className="p-2 rounded-lg border border-white/[0.08] text-[#8b8b94] hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${discordLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <a
                    href={discordInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Discord</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Live Interactive Personal App */}
            <div id="demo" className="lg:col-span-7">
              <div className="h-[520px] sm:h-[560px] w-full">
                <BladeTurboApp
                  onToggleExpand={() => setDemoExpanded(true)}
                  discordInfo={discordInfo}
                  discordLoading={discordLoading}
                  onRefreshDiscord={refreshDiscord}
                  onBrandChange={handleBrandChange}
                />
              </div>
              <p className="mt-3 text-xs text-[#8b8b94] text-center lg:text-left">
                Auto-saved workspace — customize your app name, profiles, HUD, or Discord webhook in the <strong className="text-white">Discord</strong> & <strong className="text-white">Settings</strong> tabs.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Proof Strip (Zero-Pill Unboxed Metadata) */}
        <section className="border-t border-white/[0.06] bg-[#101013] py-6">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-white">
                  ±0.5 µs
                </div>
                <div className="text-xs text-[#8b8b94] mt-0.5">timing jitter</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-white">
                  4.3 MB
                </div>
                <div className="text-xs text-[#8b8b94] mt-0.5">native binary</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-white">
                  100% Free
                </div>
                <div className="text-xs text-[#8b8b94] mt-0.5">personal build</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs text-[#7c7c85]">
              <span>SendInput · batched</span>
              <span aria-hidden="true">/</span>
              <span>High-res timer</span>
              <span aria-hidden="true">/</span>
              <span>Discord webhook bridge</span>
              <span aria-hidden="true">/</span>
              <span>Local save</span>
              <span aria-hidden="true">/</span>
              <span>No game injection</span>
            </div>
          </div>
        </section>

        <FeaturesSection />
        <BenchmarkSection />
        <HudShowcaseSection brandName={brandName} />
        <PricingAndFaq
          brandName={brandName}
          discordInviteUrl={discordInviteUrl}
          discordInfo={discordInfo}
          onOpenGetModal={() => {
            setWaitlistSubmitted(false);
            setGetModalOpen(true);
          }}
        />
      </main>

      {/* Full-Scale Expanded Workspace Modal */}
      {demoExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Personal macro full workspace"
        >
          <div className="w-full max-w-[960px] h-[640px] max-h-[90vh] relative">
            <BladeTurboApp
              isExpanded
              onToggleExpand={() => setDemoExpanded(false)}
              discordInfo={discordInfo}
              discordLoading={discordLoading}
              onRefreshDiscord={refreshDiscord}
              onBrandChange={handleBrandChange}
            />
          </div>
        </div>
      )}

      {/* Download Free / Discord Modal */}
      {getModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Download free and join Discord"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#131316] border border-white/[0.12] p-6 sm:p-7 space-y-5 relative">
            <button
              type="button"
              onClick={() => setGetModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b8b94] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <BladeLogo className="w-6 h-6" />
              <div>
                <h3 className="font-display text-lg font-bold text-white">Download {brandName}</h3>
                <p className="text-xs text-[#8b8b94]">Free Windows 10 / 11 App · Native Win32 SendInput & HUD</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#0e0e11] border border-white/[0.08] p-4 space-y-3">
              <div className="text-xs font-medium text-white">
                Includes your current profiles, hotkeys & HUD config
              </div>
              <ol className="text-xs text-[#a0a0a8] space-y-1.5 list-decimal list-inside">
                <li>Download and extract <code className="font-mono text-white">kinglock113-windows.zip</code></li>
                <li>Double-click <code className="font-mono text-white">Launch_Kinglock113.bat</code> to build & open <code className="font-mono text-white">kinglock113.exe</code></li>
                <li>Open Roblox / your game — global hotkeys & click-through HUD run automatically</li>
              </ol>

              <button
                type="button"
                disabled={downloadingWin}
                onClick={handleDownloadWindows}
                className="w-full py-2.5 px-4 rounded-lg bg-[#ff5a1f] hover:bg-[#ff6d38] text-[#0c0c0d] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {downloadingWin ? 'Packaging your config...' : 'Download for Windows (.zip)'}
                </span>
              </button>

              {downloadDone && (
                <div className="flex items-center gap-2 text-xs text-[#2ee59d]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Downloaded kinglock113-windows.zip — extract and run Launch_Kinglock113.bat.</span>
                </div>
              )}
              {downloadError && <p className="text-xs text-[#ff5a5f]">{downloadError}</p>}
            </div>

            <div className="rounded-xl bg-[#0e0e11] border border-white/[0.08] p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{serverLabel}</div>
                <div className="text-[11px] font-mono text-[#8b8b94] truncate">
                  {discordInfo?.onlineCount !== null && discordInfo?.onlineCount !== undefined
                    ? `${discordInfo.onlineCount} online · ${discordInfo.memberCount ?? 0} members`
                    : `#${discordInfo?.channelName || 'general'}`}
                </div>
              </div>
              <a
                href={discordInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <span>Discord</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="border-t border-white/[0.08] pt-4">
              {waitlistSubmitted ? (
                <div className="flex items-start gap-2.5 text-xs text-[#2ee59d] bg-[#2ee59d]/10 border border-[#2ee59d]/25 rounded-xl p-3.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Subscribed to free updates</div>
                    <div className="text-[#a0a0a8] mt-0.5">
                      Direct release notifications will be sent to <span className="text-white">{waitlistEmail}</span>.
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-2.5" noValidate>
                  <label className="block text-xs font-medium text-[#d4d4d8]">
                    Get new free version notifications by email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0c0c0d] border border-white/[0.12] focus:border-[#ff5a1f] text-xs text-white outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#1c1c21] hover:bg-[#25252c] border border-white/[0.12] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Notify me
                    </button>
                  </div>
                  {waitlistError && <p className="text-xs text-[#ff5a5f]">{waitlistError}</p>}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
