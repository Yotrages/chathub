// Audio and Web Audio ringtone utility for calling and ringing states

class RingtoneManager {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private oscillatorInterval: any = null;
  private isPlaying = false;
  private currentType: 'outgoing' | 'incoming' | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.audioContext || this.audioContext.state === 'closed') {
      try {
        this.audioContext = new AudioCtx();
      } catch (e) {
        console.warn('AudioContext creation failed:', e);
      }
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    return this.audioContext;
  }

  private playWebAudioOutgoing() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playBeep = () => {
      if (!this.isPlaying || this.currentType !== 'outgoing') return;
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gainNode.gain.setValueAtTime(0.15, now + 1.75);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.8);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (err) {
        console.warn('WebAudio tone error:', err);
      }
    };

    playBeep();
    this.oscillatorInterval = setInterval(playBeep, 4000);
  }

  private playWebAudioIncoming() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playChime = () => {
      if (!this.isPlaying || this.currentType !== 'incoming') return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const startTime = ctx.currentTime + idx * 0.25;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.5);
        });
      } catch (err) {
        console.warn('WebAudio chime error:', err);
      }
    };

    playChime();
    this.oscillatorInterval = setInterval(playChime, 3000);
  }

  public playOutgoing() {
    if (this.isPlaying && this.currentType === 'outgoing') return;
    this.stop();

    this.isPlaying = true;
    this.currentType = 'outgoing';

    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/outgoing-call.wav');
        audio.loop = true;
        this.audioElement = audio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.log('Audio file autoplay prevented, using Web Audio fallback:', err);
            this.playWebAudioOutgoing();
          });
        }
      } catch (e) {
        this.playWebAudioOutgoing();
      }
    }
  }

  public playIncoming() {
    if (this.isPlaying && this.currentType === 'incoming') return;
    this.stop();

    this.isPlaying = true;
    this.currentType = 'incoming';

    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/incoming-call.wav');
        audio.loop = true;
        this.audioElement = audio;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.log('Audio file autoplay prevented, using Web Audio fallback:', err);
            this.playWebAudioIncoming();
          });
        }
      } catch (e) {
        this.playWebAudioIncoming();
      }
    }
  }

  public stop() {
    this.isPlaying = false;
    this.currentType = null;

    if (this.oscillatorInterval) {
      clearInterval(this.oscillatorInterval);
      this.oscillatorInterval = null;
    }

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
      this.audioElement = null;
    }
  }
}

export const ringtoneManager = new RingtoneManager();

