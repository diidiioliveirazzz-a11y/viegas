"use client";

import { useEffect, useRef, useState } from "react";

export default function BarberBeatMachine() {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [isPlayingLoop, setIsPlayingLoop] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const loopIntervalRef = useRef<number | null>(null);

  function getAudioCtx(): AudioContext {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  // 1. ✂️ Tesoura Japonesa
  function playScissors() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const delay = i * 0.055;
      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(3200 + i * 800, t + delay);
      filter.Q.setValueAtTime(4, t + delay);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.038);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(t + delay);
    }
  }

  // 2. ⚡ Máquina Fade (Clipper buzz)
  function playClipper() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(115, t);
    osc.frequency.linearRampToValueAtTime(145, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(1600, t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.35);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  // 3. 💨 Spray Mist
  function playSpray() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.22);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2400, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  // 4. 🔊 808 Sub Kick
  function play808() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(165, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.09);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.56);
  }

  // 5. 🥁 Trap Snare
  function playSnare() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);

    const bufferSize = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1400, t);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  }

  // 6. 💈 Navalha Scrape
  function playRazor() {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.linearRampToValueAtTime(2900, t + 0.08);
    filter.Q.setValueAtTime(6, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  function triggerPad(id: string, soundFn: () => void) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(25);
    }
    setActivePad(id);
    soundFn();
    setTimeout(() => {
      setActivePad((curr) => (curr === id ? null : curr));
    }, 150);
  }

  function toggleTrapLoop() {
    if (isPlayingLoop) {
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
      setIsPlayingLoop(false);
      return;
    }

    setIsPlayingLoop(true);
    let step = 0;
    // 130 BPM = 16th note ~ 115ms
    const interval = window.setInterval(() => {
      const beat16 = step % 16;
      // Kick on 0, 8, 11
      if (beat16 === 0 || beat16 === 8 || beat16 === 11) {
        play808();
      }
      // Snare on 4, 12
      if (beat16 === 4 || beat16 === 12) {
        playSnare();
      }
      // Scissors click as hi-hat on even steps
      if (beat16 % 2 === 0 && beat16 !== 4 && beat16 !== 12) {
        const ctx = getAudioCtx();
        const t = ctx.currentTime;
        const bufferSize = Math.floor(ctx.sampleRate * 0.02);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(6000, t);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(t);
      }
      step++;
    }, 115);

    loopIntervalRef.current = interval;
  }

  useEffect(() => {
    return () => {
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
    };
  }, []);

  const pads = [
    { id: "scissors", key: "1", icon: "✂️", label: "TESOURA", fn: playScissors, color: "hover:border-red-500" },
    { id: "clipper", key: "2", icon: "⚡", label: "CLIPPER FADE", fn: playClipper, color: "hover:border-amber-400" },
    { id: "spray", key: "3", icon: "💨", label: "SPRAY MIST", fn: playSpray, color: "hover:border-sky-400" },
    { id: "sub808", key: "4", icon: "🔊", label: "808 SUB BASS", fn: play808, color: "hover:border-purple-500" },
    { id: "snare", key: "5", icon: "🥁", label: "TRAP SNARE", fn: playSnare, color: "hover:border-pink-500" },
    { id: "razor", key: "6", icon: "💈", label: "NAVALHA", fn: playRazor, color: "hover:border-red-400" },
  ];

  return (
    <section className="py-20 bg-zinc-950 border-t border-zinc-900 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 mb-3 px-3.5 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-black tracking-widest uppercase">
          <span>🎧</span> VIEGAS SOUNDBOARD • MPC BEAT MACHINE
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
          O BEAT DA CADEIRA
        </h2>

        <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-8">
          Toca nos pads no teu telemóvel e faz o teu próprio beat com o som real das tesouras, máquinas e 808s da barbearia.
        </p>

        {/* MPC Drum Pad Controller */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
          {/* Machine Header */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono text-xs font-black tracking-wider text-zinc-300">
                VIEGAS MPC-808
              </span>
            </div>

            <button
              type="button"
              onClick={toggleTrapLoop}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                isPlayingLoop
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse"
                  : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
              }`}
            >
              <span>{isPlayingLoop ? "⏹ PARAR BEAT" : "▶ LOOP TRAP 130 BPM"}</span>
            </button>
          </div>

          {/* Grid of 6 Pads */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {pads.map((pad) => {
              const isActive = activePad === pad.id;
              return (
                <button
                  key={pad.id}
                  type="button"
                  onClick={() => triggerPad(pad.id, pad.fn)}
                  className={`relative p-5 sm:p-6 rounded-2xl border text-center transition select-none active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-red-600/30 border-red-500 shadow-xl shadow-red-600/40 scale-95"
                      : "bg-zinc-950/80 border-zinc-800 hover:bg-zinc-800/60 " + pad.color
                  }`}
                >
                  <span className="text-3xl sm:text-4xl filter drop-shadow">{pad.icon}</span>
                  <span className="font-mono text-xs font-black tracking-wider text-zinc-200">
                    {pad.label}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                    [{pad.key}]
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex justify-between items-center">
            <span>✂️ Áudio 100% sintetizado em tempo real</span>
            <span className="text-red-400 font-bold">100% Som Analógico</span>
          </div>
        </div>
      </div>
    </section>
  );
}
