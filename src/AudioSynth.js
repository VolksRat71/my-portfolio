class AudioSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;
    this.allowBootSound = true; // Only allow boot sound during initial boot
  }

  init() {
    if (this.initialized) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Master volume
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  disableBootSound() {
    this.allowBootSound = false;
  }

  enableBootSound() {
    this.allowBootSound = true;
  }

  // Helper to create noise buffer
  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playTurnOn() {
    // Only play boot sound if we're still in the boot phase
    if (!this.allowBootSound) {
      console.log('Boot sound blocked - boot phase has ended');
      return;
    }

    if (!this.initialized) this.init();

    // If the AudioContext is suspended, don't schedule the sounds
    // They would just play later when the context resumes (e.g., on user interaction)
    if (this.ctx.state === 'suspended') {
      console.log('Boot sound blocked - AudioContext is suspended');
      // Do NOT disable boot sound permanently, just return for now.
      // If we resume later (e.g. via click), we might want to play it,
      // or at least allow it on next reboot.
      return;
    }

    this.resume();

    const t = this.ctx.currentTime;

    // 1. High frequency rising tone (CRT charging)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(15000, t + 1.0);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.5);

    // 2. White noise burst (Static)
    const noise = this.ctx.createBufferSource();
    const noiseGain = this.ctx.createGain();

    noise.buffer = this.createNoiseBuffer();

    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.5);

    // 3. Degauss "Thump"
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();

    thump.frequency.setValueAtTime(50, t);
    thump.frequency.exponentialRampToValueAtTime(10, t + 0.5);

    thumpGain.gain.setValueAtTime(0.5, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);

    thump.start(t);
    thump.stop(t + 0.5);
  }

  playTurnOff() {
    if (!this.initialized) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Pitch drop (Capacitor draining)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(15000, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.5);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.5);

    // Screen collapse "pop"
    const pop = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();

    pop.type = 'square';
    pop.frequency.setValueAtTime(50, t + 0.4);

    popGain.gain.setValueAtTime(0, t + 0.4);
    popGain.gain.linearRampToValueAtTime(0.1, t + 0.41);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    pop.connect(popGain);
    popGain.connect(this.masterGain);

    pop.start(t + 0.4);
    pop.stop(t + 0.5);
  }

  playClick() {
    if (!this.initialized) this.init();
    this.resume();

    const t = this.ctx.currentTime;

    // High pitched click (switch)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Randomize pitch slightly for realism
    const freq = 2000 + Math.random() * 500;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);

    // Low thud (key bottoming out)
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();

    thud.type = 'sine';
    thud.frequency.setValueAtTime(200, t);
    thud.frequency.exponentialRampToValueAtTime(50, t + 0.05);

    thudGain.gain.setValueAtTime(0.1, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    thud.connect(thudGain);
    thudGain.connect(this.masterGain);

    thud.start(t);
    thud.stop(t + 0.05);
  }
}

export const audioSynth = new AudioSynth();
