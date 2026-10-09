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
};