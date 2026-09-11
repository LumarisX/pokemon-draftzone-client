import { Injectable, OnDestroy } from '@angular/core';

const NOISE_SECONDS = 0.05;
const TICK_ATTACK = 0.001;
const TICK_DECAY = 0.03;
const TICK_FILTER_HZ = 1900;
const TICK_SPREAD = 0.12;
const TICK_Q = 1.4;
const MAX_GAIN = 0.6;

@Injectable()
export class WheelSoundService implements OnDestroy {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private pending = new Set<AudioBufferSourceNode>();
  private level = 1;

  get now(): number {
    return this.context?.currentTime ?? 0;
  }

  setLevel(level: number): void {
    this.level = Math.min(1, Math.max(0, level));
    if (this.master) this.master.gain.value = this.gain();
  }

  prepare(): boolean {
    if (typeof AudioContext === 'undefined') return false;

    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.gain();
      this.master.connect(this.context.destination);
      this.noise = this.buildNoise(this.context);
    }

    if (this.context.state === 'suspended') void this.context.resume();
    return this.context.state !== 'closed';
  }

  tickAt(when: number): void {
    const context = this.context;
    const master = this.master;
    const noise = this.noise;
    if (!context || !master || !noise) return;

    const source = context.createBufferSource();
    source.buffer = noise;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value =
      TICK_FILTER_HZ * (1 - TICK_SPREAD / 2 + Math.random() * TICK_SPREAD);
    filter.Q.value = TICK_Q;

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.linearRampToValueAtTime(1, when + TICK_ATTACK);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + TICK_DECAY);

    source.connect(filter).connect(envelope).connect(master);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
      this.pending.delete(source);
    };

    source.start(when);
    source.stop(when + NOISE_SECONDS);
    this.pending.add(source);
  }

  cancel(): void {
    for (const source of this.pending) {
      try {
        source.stop();
      } catch {}
    }
    this.pending.clear();
  }

  ngOnDestroy(): void {
    this.cancel();
    void this.context?.close();
    this.context = null;
  }

  private gain(): number {
    return MAX_GAIN * this.level ** 2;
  }

  private buildNoise(context: AudioContext): AudioBuffer {
    const frames = Math.ceil(context.sampleRate * NOISE_SECONDS);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      samples[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
    }
    return buffer;
  }
}
