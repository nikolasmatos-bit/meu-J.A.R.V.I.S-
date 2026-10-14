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

function safe(fn: () => void) {
  try {
    fn();
  } catch (e) {
    console.warn("[SFX] erro silenciado:", e);
  }
}

// ============================================
// SOM AMBIENTE
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
// SONS DE UI — todos com safe()
// ============================================
export const SFX = {
  click() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(800, c.currentTime);
      envelope(g, c.currentTime, 0.002, 0.03, 0.15);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.05);
    });
  },

  keyClick() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(2400, c.currentTime);
      envelope(g, c.currentTime, 0.001, 0.015, 0.08);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.02);
    });
  },

  hover() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(1800, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(2200, c.currentTime + 0.04);
      envelope(g, c.currentTime, 0.001, 0.04, 0.04);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.06);
    });
  },

  menuOpen() {
    safe(() => {
      const c = getCtx();
      [660, 880].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.04);
        envelope(g, c.currentTime + i * 0.04, 0.005, 0.12, 0.06);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.04);
        o.stop(c.currentTime + i * 0.04 + 0.15);
      });
    });
  },

  menuClose() {
    safe(() => {
      const c = getCtx();
      [880, 660].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.04);
        envelope(g, c.currentTime + i * 0.04, 0.005, 0.1, 0.05);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.04);
        o.stop(c.currentTime + i * 0.04 + 0.12);
      });
    });
  },

  personaSwitch() {
    safe(() => {
      const c = getCtx();
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.06);
        envelope(g, c.currentTime + i * 0.06, 0.01, 0.2, 0.08);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.06);
        o.stop(c.currentTime + i * 0.06 + 0.25);
      });
    });
  },

  modeSwitch() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const f = c.createBiquadFilter();
      const g = c.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(400, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15);
      f.type = "bandpass";
      f.frequency.setValueAtTime(800, c.currentTime);
      f.Q.setValueAtTime(4, c.currentTime);
      envelope(g, c.currentTime, 0.005, 0.18, 0.08);
      o.connect(f).connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.2);
    });
  },

  messageSend() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(1200, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(2400, c.currentTime + 0.1);
      envelope(g, c.currentTime, 0.003, 0.12, 0.08);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.15);
    });
  },

  messageReceive() {
    safe(() => {
      const c = getCtx();
      [1318.51, 1567.98].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.05);
        envelope(g, c.currentTime + i * 0.05, 0.005, 0.18, 0.09);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.05);
        o.stop(c.currentTime + i * 0.05 + 0.22);
      });
    });
  },

  memorySave() {
    safe(() => {
      const c = getCtx();
      [1046.5, 1318.51, 1567.98].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.07);
        envelope(g, c.currentTime + i * 0.07, 0.008, 0.25, 0.07);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.07);
        o.stop(c.currentTime + i * 0.07 + 0.3);
      });
    });
  },

  bootComplete() {
    safe(() => {
      const c = getCtx();
      [523.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.1);
        envelope(g, c.currentTime + i * 0.1, 0.01, 0.4, 0.09);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.1);
        o.stop(c.currentTime + i * 0.1 + 0.5);
      });
    });
  },

  buttonPress() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(1200, c.currentTime);
      o.frequency.setValueAtTime(900, c.currentTime + 0.03);
      envelope(g, c.currentTime, 0.002, 0.05, 0.12);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.08);
    });
  },

  reactorEngage() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const f = c.createBiquadFilter();
      const g = c.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(660, c.currentTime + 0.4);
      f.type = "lowpass";
      f.frequency.setValueAtTime(1200, c.currentTime);
      f.Q.setValueAtTime(8, c.currentTime);
      envelope(g, c.currentTime, 0.05, 0.5, 0.12);
      o.connect(f).connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.6);
    });
  },

  sendWhoosh() {
    safe(() => {
      const c = getCtx();
      const n = c.createBufferSource();
      const b = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      }
      n.buffer = b;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(800, c.currentTime);
      f.frequency.exponentialRampToValueAtTime(3000, c.currentTime + 0.3);
      f.Q.setValueAtTime(2, c.currentTime);
      const g = c.createGain();
      envelope(g, c.currentTime, 0.02, 0.35, 0.08);
      n.connect(f).connect(g).connect(c.destination);
      n.start();
      n.stop(c.currentTime + 0.4);
    });
  },

  thinkBeep() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(1500, c.currentTime);
      envelope(g, c.currentTime, 0.005, 0.08, 0.04);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.1);
    });
  },

  responseDone() {
    safe(() => {
      const c = getCtx();
      [523.25, 659.25].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.08);
        envelope(g, c.currentTime + i * 0.08, 0.01, 0.4, 0.1);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.08);
        o.stop(c.currentTime + i * 0.08 + 0.5);
      });
    });
  },

  error() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(150, c.currentTime);
      o.frequency.setValueAtTime(120, c.currentTime + 0.15);
      envelope(g, c.currentTime, 0.005, 0.35, 0.08);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.4);
    });
  },

  servoMove() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const f = c.createBiquadFilter();
      const g = c.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(180, c.currentTime);
      o.frequency.linearRampToValueAtTime(90, c.currentTime + 0.3);
      f.type = "bandpass";
      f.frequency.setValueAtTime(400, c.currentTime);
      f.Q.setValueAtTime(6, c.currentTime);
      envelope(g, c.currentTime, 0.02, 0.35, 0.06);
      o.connect(f).connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.4);
    });
  },

  wakeDetected() {
    safe(() => {
      const c = getCtx();
      [880, 1108.73, 1318.51].forEach((f, i) => {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(f, c.currentTime + i * 0.05);
        envelope(g, c.currentTime + i * 0.05, 0.005, 0.2, 0.1);
        o.connect(g).connect(c.destination);
        o.start(c.currentTime + i * 0.05);
        o.stop(c.currentTime + i * 0.05 + 0.25);
      });
    });
  },

  typingStart() {
    safe(() => {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(1200, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.15);
      envelope(g, c.currentTime, 0.005, 0.1, 0.05);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.15);
    });
  },

  startAmbient() { safe(() => startAmbientImpl()); },
  stopAmbient() { safe(() => stopAmbientImpl()); },
  isAmbientActive() { return ambientRunning; },
  setAmbientMood(m: "idle" | "thinking" | "speaking") { safe(() => setAmbientMoodImpl(m)); },
};