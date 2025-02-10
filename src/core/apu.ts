
export class APU {
  private channel1: Channel
  private channel2: Channel
  private channel3: Channel
  private channel4: Channel
  private resampler: Resampler;
  private outputSampleRate: number;

  constructor() {
    this.channel1 = new Channel()
    this.channel2 = new Channel()
    this.channel3 = new Channel()
    this.channel4 = new Channel()
    this.outputSampleRate = 48000; // Increased from 44100 for better quality
    this.resampler = new Resampler(
      4194304 / 64, // Game Boy's approximate audio sample rate
      this.outputSampleRate,
      2, // Stereo output
      4096 // Increased buffer size for smoother output
    );
  }

  public step(cycles: number): void {
    this.channel1.step(cycles)
    this.channel2.step(cycles)
    this.channel3.step(cycles)
    this.channel4.step(cycles)
  }

  public getAudioBuffer(size: number): Float32Array {
    const buffer = new Float32Array(size * 2);
    const samplesPerFrame = size / (48000 / 59.73); // GB frame rate
    
    for (let i = 0; i < size; i++) {
      const position = i / samplesPerFrame;
      // Improved mixing with proper volume scaling
      const ch1 = this.channel1.getSample() * 0.25
      const ch2 = this.channel2.getSample() * 0.25
      const ch3 = this.channel3.getSample() * 0.25
      const ch4 = this.channel4.getSample() * 0.15 // Slightly lower noise volume
      
      // Better mixing algorithm with soft clipping
      const left = this.softClip((ch1 + ch2 + ch3 + ch4) * 0.8)
      const right = this.softClip((ch1 + ch2 + ch3 + ch4) * 0.8)
      
      buffer[i * 2] = left
      buffer[i * 2 + 1] = right
    }
    
    return buffer;
  }

  private softClip(sample: number): number {
    // Soft clipping to prevent harsh distortion
    if (sample > 1.0) return 1.0
    if (sample < -1.0) return -1.0
    return sample - ((sample * sample * sample) / 3.0)
  }
}

class Channel {
  private frequency = 440
  private volume = 0.8  // Reduced from 1.0 to prevent clipping
  private phase = 0
  private waveform = 'square' // Added waveform type
  private sweepTime = 0;
  private sweepDirection = 1;
  private envelopeStep = 0;
  private duty = 0.5; // For pulse channels
  private envelopeVolume = 0;
  private envelopePeriod = 0;
  private envelopeCounter = 0;
  private envelopeDirection = 1;
  private sweepEnabled = false;
  private sweepPeriod = 0;
  private sweepShift = 0;

  public step(cycles: number): void {
    this.phase += (this.frequency * cycles) / 4194304 // GameBoy clock speed
    this.phase %= 1
  }

  public getSample(): number {
    switch (this.waveform) {
      case 'pulse':
        return this.phase < this.duty ? this.volume : -this.volume;
      case 'square':
        return this.phase < 0.5 ? this.volume : -this.volume
      case 'sine':
        return Math.sin(this.phase * Math.PI * 2) * this.volume
      default:
        return this.phase < 0.5 ? this.volume : -this.volume
    }
  }

  public updateEnvelope(): void {
    if (this.envelopePeriod > 0) {
      this.envelopeCounter--;
      if (this.envelopeCounter <= 0) {
        this.envelopeCounter = this.envelopePeriod;
        if (this.envelopeDirection > 0 && this.envelopeVolume < 15)
          this.envelopeVolume++;
        else if (this.envelopeDirection < 0 && this.envelopeVolume > 0)
          this.envelopeVolume--;
      }
    }
  }

  public updateSweep(): void {
    if (this.sweepEnabled && this.sweepPeriod > 0) {
      // Implement GB-accurate frequency sweep
    }
  }
}

