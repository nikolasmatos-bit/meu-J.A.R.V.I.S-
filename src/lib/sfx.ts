let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function envelope(gain: GainNode, start: number, attack: number, decay: number, peak: number) {
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
}

// ============================================
// SOM AMBIENTE (singleton)
// ============================================
let ambient: {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  filter: BiquadFilterNode;
  master: GainNode;
} | null = null;

let ambientRunning = false;

function startAmbientImpl() {
  if (ambientRunning) return;
  const c = getCtx();
  const master = c.createGain();
  master.gain.setValueAtTime(0, c.currentTime);
  master.gain.linearRampToValueAtTime(0.035, c.currentTime + 2.5);

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(220, c.currentTime);
  filter.Q.setValueAtTime(6, c.currentTime);

  const osc1 = c.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(58, c.currentTime);

  const osc2 = c.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(116, c.currentTime);

  const lfo = c.createOscillator();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.25, c.currentTime);
  const lfoGain = c.createGain();
  lfoGain.gain.setValueAtTime(3, c.currentTime);

  osc1.connect(filter);
  osc2.connect(filter);
  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);
  lfoGain.connect(osc2.frequency);
  filter.connect(master);
  master.connect(c.destination);

  osc1.start();
  osc2.start();
  lfo.start();

  ambient = { osc1, osc2, lfo, lfoGain, filter, master };
  ambientRunning = true;
}

function stopAmbientImpl() {
  if (!ambient) return;
  const c = getCtx();
  const a = ambient;
  a.master.gain.cancelScheduledValues(c.currentTime);
  a.master.gain.setValueAtTime(a.master.gain.value, c.currentTime);
  a.master.gain.linearRampToValueAtTime(0, c.currentTime + 1);
  setTimeout(() => {
    try { a.osc1.stop(); } catch {}
    try { a.osc2.stop(); } catch {}
    try { a.lfo.stop(); } catch {}
  }, 1100);
  ambient = null;
  ambientRunning = false;
}

function setAmbientMoodImpl(mood: "idle" | "thinking" | "speaking") {
  if (!ambient) return;
  const c = getCtx();
  const a = ambient;
  const t = c.currentTime;
  if (mood === "thinking") {
    a.osc1.frequency.cancelScheduledValues(t);
    a.osc1.frequency.linearRampToValueAtTime(78, t + 0.4);
    a.osc2.frequency.cancelScheduledValues(t);
    a.osc2.frequency.linearRampToValueAtTime(156, t + 0.4);
    a.master.gain.cancelScheduledValues(t);
    a.master.gain.linearRampToValueAtTime(0.055, t + 0.4);
  } else if (mood === "speaking") {
    a.osc1.frequency.cancelScheduledValues(t);
    a.osc1.frequency.linearRampToValueAtTime(95, t + 0.3);
    a.osc2.frequency.cancelScheduledValues(t);
    a.osc2.frequency.linearRampToValueAtTime(190, t + 0.3);
    a.master.gain.cancelScheduledValues(t);
    a.master.gain.linearRampToValueAtTime(0.065, t + 0.3);
  } else {
    a.osc1.frequency.cancelScheduledValues(t);
    a.osc1.frequency.linearRampToValueAtTime(58, t + 1);
    a.osc2.frequency.cancelScheduledValues(t);
    a.osc2.frequency.linearRampToValueAtTime(116, t + 1);
    a.master.gain.cancelScheduledValues(t);
    a.master.gain.linearRampToValueAtTime(0.035, t + 1);
  }
}

// ============================================
// SONS DE UI
// ============================================
export const SFX = {
  click() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, c.currentTime);
    envelope(gain, c.currentTime, 0.002, 0.03, 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.05);
  },

  keyClick() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(2400, c.currentTime);
    envelope(gain, c.currentTime, 0.001, 0.015, 0.08);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.02);
  },

  reactorEngage() {
    const c = getCtx();
    const osc = c.createOscillator();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, c.currentTime + 0.4);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, c.currentTime);
    filter.Q.setValueAtTime(8, c.currentTime);
    envelope(gain, c.currentTime, 0.05, 0.5, 0.12);
    osc.connect(filter).connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.6);
  },

  sendWhoosh() {
    const c = getCtx();
    const noise = c.createBufferSource();
    const buffer = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    noise.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, c.currentTime + 0.3);
    filter.Q.setValueAtTime(2, c.currentTime);
    const gain = c.createGain();
    envelope(gain, c.currentTime, 0.02, 0.35, 0.08);
    noise.connect(filter).connect(gain).connect(c.destination);
    noise.start();
    noise.stop(c.currentTime + 0.4);
  },

  thinkBeep() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1500, c.currentTime);
    envelope(gain, c.currentTime, 0.005, 0.08, 0.04);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.1);
  },

  responseDone() {
    const c = getCtx();
    [523.25, 659.25].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.08);
      envelope(gain, c.currentTime + i * 0.08, 0.01, 0.4, 0.1);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime + i * 0.08);
      osc.stop(c.currentTime + i * 0.08 + 0.5);
    });
  },

  error() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, c.currentTime);
    osc.frequency.setValueAtTime(120, c.currentTime + 0.15);
    envelope(gain, c.currentTime, 0.005, 0.35, 0.08);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.4);
  },

  servoMove() {
    const c = getCtx();
    const osc = c.createOscillator();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, c.currentTime);
    osc.frequency.linearRampToValueAtTime(90, c.currentTime + 0.3);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, c.currentTime);
    filter.Q.setValueAtTime(6, c.currentTime);
    envelope(gain, c.currentTime, 0.02, 0.35, 0.06);
    osc.connect(filter).connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.4);
  },

  wakeDetected() {
    const c = getCtx();
    [880, 1108.73, 1318.51].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, c.currentTime + i * 0.05);
      envelope(gain, c.currentTime + i * 0.05, 0.005, 0.2, 0.1);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime + i * 0.05);
      osc.stop(c.currentTime + i * 0.05 + 0.25);
    });
  },

  // === AMBIENTE ===
  startAmbient() { startAmbientImpl(); },
  stopAmbient() { stopAmbientImpl(); },
  isAmbientActive() { return ambientRunning; },
  setAmbientMood(mood: "idle" | "thinking" | "speaking") { setAmbientMoodImpl(mood); },
};