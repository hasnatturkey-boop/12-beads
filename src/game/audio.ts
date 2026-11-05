import { SoundStyle } from '../types';

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.85;
  public style: SoundStyle = 'wood';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Realistic wooden slide friction sound
  playBeadSlide() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume * 0.45, now);
      masterGain.connect(this.ctx.destination);

      // Low frequency gentle wood friction noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(350, now + 0.18);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noise.start(now);
    } catch {}
  }

  // Realistic metallic coin toss spin & landing chime
  playCoinToss() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // 3 rapid spinning metallic clicks
      [0, 0.08, 0.16, 0.26, 0.38, 0.52].forEach((offset, idx) => {
        if (!this.ctx) return;
        const time = now + offset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400 + idx * 80, time);
        osc.frequency.exponentialRampToValueAtTime(800, time + 0.04);

        gain.gain.setValueAtTime(this.volume * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.045);
      });

      // Landing bell chime at ~0.75s
      setTimeout(() => {
        try {
          if (!this.ctx) return;
          const landTime = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(1760, landTime); // A6 bell
          osc1.frequency.exponentialRampToValueAtTime(880, landTime + 0.4);

          gain1.gain.setValueAtTime(this.volume * 0.7, landTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, landTime + 0.45);

          osc1.connect(gain1);
          gain1.connect(this.ctx.destination);
          osc1.start(landTime);
          osc1.stop(landTime + 0.45);
        } catch {}
      }, 750);
    } catch {}
  }

  // Realistic wooden clack synthesizer
  playBeadMove(style: SoundStyle = this.style) {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume * 0.7, now);
      masterGain.connect(this.ctx.destination);

      if (style === 'wood') {
        // Wooden bead: short resonant thud + micro transient tap
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        oscGain.gain.setValueAtTime(0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        // Click transient (filtered noise)
        const bufferSize = this.ctx.sampleRate * 0.02;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(2, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.09);
        noise.start(now);
      } else if (style === 'marble') {
        // High density marble clack
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
      } else {
        // Brass metallic bead
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1450, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.setValueAtTime(6, now);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // Audio error silently ignored
    }
  }

  // Realistic capture snap / strike sound
  playBeadCapture(isLossForUser: boolean = false) {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(this.ctx.destination);

      if (!isLossForUser) {
        // Victorious sharp crack & resonant strike
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(520, now);
        osc1.frequency.exponentialRampToValueAtTime(160, now + 0.18);

        gain1.gain.setValueAtTime(1.0, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

        // Crack transient
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(900, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        // Crisp secondary high knock
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        gain2.gain.setValueAtTime(0.4, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc1.start(now);
        osc1.stop(now + 0.2);
        noise.start(now);
        osc2.start(now);
        osc2.stop(now + 0.13);
      } else {
        // Deep warning thud / being captured
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.28);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.29);
      }
    } catch {
      // Audio error silently ignored
    }
  }

  // Bead selection click
  playBeadSelect() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // Chain capture combo
  playChainCapture() {
    if (!this.enabled || this.volume <= 0) return;
    this.playBeadCapture(false);
    setTimeout(() => {
      try {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(784, now);
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.15);
        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } catch {}
    }, 90);
  }

  // Victory fanfare
  playVictory() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const start = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const time = start + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(this.volume * 0.6, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + (idx === 3 ? 0.6 : 0.25));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + (idx === 3 ? 0.65 : 0.3));
      });
    } catch {}
  }

  // Defeat tone
  playDefeat() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [440, 415.3, 392, 349.2]; // A4, Ab4, G4, F4
      const start = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const time = start + idx * 0.16;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(this.volume * 0.5, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.36);
      });
    } catch {}
  }

  // Simple UI button click
  playButtonClick() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.03);

      gain.gain.setValueAtTime(this.volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }
}

export const sound = new SoundController();
