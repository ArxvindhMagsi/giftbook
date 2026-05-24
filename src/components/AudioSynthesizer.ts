// Custom Web Audio API Synth with premium MP3 BGM player and micro SFX
export class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private bgm: HTMLAudioElement | null = null;

  constructor() {
    // Initialized lazily upon user interaction to follow browser security policies
  }

  public toggle(forceState?: boolean): boolean {
    if (forceState === true) {
      if (!this.isPlaying) {
        this.start();
      }
      return true;
    } else if (forceState === false) {
      if (this.isPlaying) {
        this.stop();
      }
      return false;
    } else {
      if (this.isPlaying) {
        this.stop();
        return false;
      } else {
        this.start();
        return true;
      }
    }
  }


  public setMode(mode: "piano" | "bells") {
    // Mode is kept for backward compatibility, but now we play the beautiful BGM
  }

  private start() {
    try {
      if (!this.bgm) {
        this.bgm = new Audio("/the_love_bug_has_bitten_bgm.mp3");
        this.bgm.loop = true;
        this.bgm.volume = 0.6; // perfect romantic background volume
      }

      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.isPlaying = true;
      this.bgm.play().catch(e => console.error("BGM playback blocked or failed:", e));
    } catch (e) {
      console.error("Audio context initialization failed", e);
    }
  }

  private stop() {
    this.isPlaying = false;
    if (this.bgm) {
      this.bgm.pause();
    }
  }


  public playTypingSound() {
    // Quick, sweet feedback tick
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(900 + Math.random() * 300, now);
      gain.gain.setValueAtTime(0.002, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) { }
  }

  public playPageTurnSound() {
    // Soft sound approximating paper rustling / sweep sweep chime
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "triangle";
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1000, now + 0.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.008, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) { }
  }

  public playHeartSound() {
    // Cute high frequency pop/bubble sound when clicking Heart
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      // Sweet sliding chime
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) { }
  }
}
