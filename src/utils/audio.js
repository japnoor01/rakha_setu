// Web Audio API synthesizer for instant, zero-dependency sound effects
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playBeep(freq = 440, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy catch
    }
  }

  // Emergency Siren Pulse (Civic Alert)
  playEmergencyAlert() {
    if (this.muted) return;
    this.playBeep(880, 'sawtooth', 0.25, 0.15);
    setTimeout(() => this.playBeep(660, 'sawtooth', 0.35, 0.12), 200);
    setTimeout(() => this.playBeep(880, 'sawtooth', 0.25, 0.15), 550);
  }

  // SOS Sent Notification
  playSosSent() {
    if (this.muted) return;
    this.playBeep(520, 'sine', 0.15, 0.15);
    setTimeout(() => this.playBeep(780, 'sine', 0.2, 0.15), 150);
    setTimeout(() => this.playBeep(1040, 'triangle', 0.3, 0.15), 300);
  }

  // Responder Task Dispatch Ping
  playDispatchChime() {
    if (this.muted) return;
    this.playBeep(600, 'triangle', 0.1, 0.12);
    setTimeout(() => this.playBeep(900, 'sine', 0.15, 0.15), 120);
    setTimeout(() => this.playBeep(1200, 'sine', 0.25, 0.12), 250);
  }

  // Task Accepted Confirmed
  playTaskAccepted() {
    if (this.muted) return;
    this.playBeep(440, 'sine', 0.12, 0.12);
    setTimeout(() => this.playBeep(554, 'sine', 0.12, 0.12), 100);
    setTimeout(() => this.playBeep(659, 'sine', 0.2, 0.15), 200);
    setTimeout(() => this.playBeep(880, 'triangle', 0.3, 0.15), 320);
  }

  // AI Risk Calculation Complete
  playAiAnalyze() {
    if (this.muted) return;
    this.playBeep(300, 'square', 0.08, 0.08);
    setTimeout(() => this.playBeep(450, 'square', 0.08, 0.08), 80);
    setTimeout(() => this.playBeep(700, 'sawtooth', 0.15, 0.1), 160);
  }
}

export const soundFx = new SoundEffects();
