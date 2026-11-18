import type { SoundPack } from '../types/bladeturbo';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playMacroCue(
  kind: 'start' | 'stop',
  pack: SoundPack,
  volumePct: number
): void {
  const ctx = getCtx();
  if (!ctx || volumePct <= 0) return;

  const now = ctx.currentTime;
  const vol = Math.min(1, Math.max(0, volumePct / 100)) * 0.22;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (pack === 'soft') {
    osc.type = 'sine';
    const f1 = kind === 'start' ? 520 : 390;
    const f2 = kind === 'start' ? 660 : 300;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f2, now + 0.08);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.start(now);
    osc.stop(now + 0.12);
  } else if (pack === 'mechanical') {
    osc.type = 'triangle';
    const f1 = kind === 'start' ? 1180 : 760;
    const f2 = kind === 'start' ? 1560 : 520;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.exponentialRampToValueAtTime(f2, now + 0.035);
    gain.gain.setValueAtTime(vol * 1.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.start(now);
    osc.stop(now + 0.06);
  } else {
    osc.type = 'square';
    const f1 = kind === 'start' ? 440 : 587;
    const f2 = kind === 'start' ? 880 : 293;
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.setValueAtTime(f2, now + 0.045);
    gain.gain.setValueAtTime(vol * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.11);
  }
}
