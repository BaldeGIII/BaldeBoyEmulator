export class APU {
  private static readonly SAMPLE_RATE = 48000;
  private static readonly FRAME_SEQUENCER_RATE = 512;
  private static readonly GBC_CLOCK = 4194304; // GBC base clock speed
  
  // Sound control registers
  private static readonly NR50 = 0xFF24;
  private static readonly NR51 = 0xFF25;
  private static readonly NR52 = 0xFF26;
  
  private frameSequencerCycles = 0;
  private frameSequencerStep = 0;
  private isGbcMode = true; // GBC mode flag
  
  private channel1: PulseChannel;
  private channel2: PulseChannel;
  private channel3: WaveChannel;
  private channel4: NoiseChannel;
  
  private leftVolume: number;
  private rightVolume: number;
  private vinLeftEnable: boolean;
  private vinRightEnable: boolean;
  private channelControl: number = 0xFF; // All channels enabled by default
  private masterEnable: boolean = true;
  
  constructor() {
    this.channel1 = new PulseChannel(true);  // With sweep
    this.channel2 = new PulseChannel(false); // Without sweep
    this.channel3 = new WaveChannel();
    this.channel4 = new NoiseChannel();
    
    this.leftVolume = 7;
    this.rightVolume = 7;
    this.vinLeftEnable = false;
    this.vinRightEnable = false;
  }

  public writeRegister(address: number, value: number): void {
    if (!this.masterEnable && address !== APU.NR52) return;

    switch (address) {
      case APU.NR50:
        this.leftVolume = (value >> 4) & 0x07;
        this.rightVolume = value & 0x07;
        this.vinLeftEnable = (value & 0x80) !== 0;
        this.vinRightEnable = (value & 0x08) !== 0;
        break;
      case APU.NR51:
        this.channelControl = value;
        break;
      case APU.NR52:
        if ((value & 0x80) !== (this.masterEnable ? 0x80 : 0)) {
          this.masterEnable = (value & 0x80) !== 0;
          if (!this.masterEnable) this.reset();
        }
        break;
    }
  }

  public step(cycles: number): void {
    if (!this.masterEnable) return;

    // Adjust cycles for GBC double-speed mode if needed
    const adjustedCycles = this.isGbcMode ? cycles / 2 : cycles;
    
    this.frameSequencerCycles += adjustedCycles;
    if (this.frameSequencerCycles >= APU.FRAME_SEQUENCER_RATE) {
      this.frameSequencerCycles -= APU.FRAME_SEQUENCER_RATE;
      this.updateFrameSequencer();
    }

    this.channel1.step(adjustedCycles);
    this.channel2.step(adjustedCycles);
    this.channel3.step(adjustedCycles);
    this.channel4.step(adjustedCycles);
  }

  public getSample(): [number, number] {
    if (!this.masterEnable) return [0, 0];

    const ch1 = this.channel1.getSample();
    const ch2 = this.channel2.getSample();
    const ch3 = this.channel3.getSample();
    const ch4 = this.channel4.getSample();

    // Apply channel control (NR51) mixing
    let left = 0;
    let right = 0;

    if (this.channelControl & 0x10) left += ch1;
    if (this.channelControl & 0x20) left += ch2;
    if (this.channelControl & 0x40) left += ch3;
    if (this.channelControl & 0x80) left += ch4;

    if (this.channelControl & 0x01) right += ch1;
    if (this.channelControl & 0x02) right += ch2;
    if (this.channelControl & 0x04) right += ch3;
    if (this.channelControl & 0x08) right += ch4;

    // Apply master volume
    left = (left / 4) * (this.leftVolume / 7);
    right = (right / 4) * (this.rightVolume / 7);

    return [left, right];
  }

  private reset(): void {
    this.frameSequencerCycles = 0;
    this.frameSequencerStep = 0;
    this.channelControl = 0;
    this.leftVolume = 0;
    this.rightVolume = 0;
    this.vinLeftEnable = false;
    this.vinRightEnable = false;
    
    // Reset all channels
    this.channel1 = new PulseChannel(true);
    this.channel2 = new PulseChannel(false);
    this.channel3 = new WaveChannel();
    this.channel4 = new NoiseChannel();
  }
}

abstract class Channel {
    protected enabled: boolean = false;
    protected lengthCounter: number = 0;
    protected lengthEnabled: boolean = false;
    protected timer: number = 0;
    
    public clockLength(): void {
        if (this.lengthEnabled && this.lengthCounter > 0) {
            this.lengthCounter--;
            if (this.lengthCounter === 0) {
                this.enabled = false;
            }
        }
    }

    abstract step(cycles: number): void;
    abstract getSample(): number;
}

class PulseChannel extends Channel {
    private static readonly DUTY_PATTERNS = [
        [0, 0, 0, 0, 0, 0, 0, 1], // 12.5%
        [0, 0, 0, 0, 0, 0, 1, 1], // 25%
        [0, 0, 0, 0, 1, 1, 1, 1], // 50%
        [1, 1, 1, 1, 1, 1, 0, 0]  // 75%
    ];

    private frequency: number = 0;
    private dutyPattern: number = 2;
    private dutyStep: number = 0;
    private sweepEnabled: boolean;
    private sweepPeriod: number = 0;
    private sweepShift: number = 0;
    private sweepNegate: boolean = false;
    private volume: number = 0;
    private envelopePeriod: number = 0;
    private envelopeAdd: boolean = false;
    private envelopeTimer: number = 0;

    constructor(hasSweep: boolean) {
        super();
        this.sweepEnabled = hasSweep;
    }

    public step(cycles: number): void {
        if (!this.enabled) return;
        
        this.timer -= cycles;
        if (this.timer <= 0) {
            this.timer += (2048 - this.frequency) * 4;
            this.dutyStep = (this.dutyStep + 1) & 7;
        }
    }

    public getSample(): number {
        if (!this.enabled) return 0;
        return PulseChannel.DUTY_PATTERNS[this.dutyPattern][this.dutyStep] * this.volume;
    }

    public clockSweep(): void {
        if (!this.sweepEnabled || this.sweepPeriod === 0) return;
        
        if (--this.envelopeTimer <= 0) {
            this.envelopeTimer = this.sweepPeriod;
            
            const newFreq = this.calculateSweepFrequency();
            if (newFreq <= 2047 && this.sweepShift > 0) {
                this.frequency = newFreq;
                this.calculateSweepFrequency(); // Overflow check
            }
        }
    }

    public clockEnvelope(): void {
        if (this.envelopePeriod === 0) return;
        
        if (--this.envelopeTimer <= 0) {
            this.envelopeTimer = this.envelopePeriod;
            
            if (this.envelopeAdd && this.volume < 15) {
                this.volume++;
            } else if (!this.envelopeAdd && this.volume > 0) {
                this.volume--;
            }
        }
    }

    private calculateSweepFrequency(): number {
        let delta = this.frequency >> this.sweepShift;
        return this.sweepNegate ? this.frequency - delta : this.frequency + delta;
    }
}

class WaveChannel extends Channel {
    private waveRAM: Uint8Array = new Uint8Array(16);
    private frequency: number = 0;
    private position: number = 0;
    private volumeCode: number = 0;

    public step(cycles: number): void {
        if (!this.enabled) return;
        
        this.timer -= cycles;
        if (this.timer <= 0) {
            this.timer += (2048 - this.frequency) * 2;
            this.position = (this.position + 1) & 31;
        }
    }

    public getSample(): number {
        if (!this.enabled) return 0;
        
        const sample = this.waveRAM[this.position >> 1];
        const nibble = this.position & 1 ? sample & 0xF : sample >> 4;
        
        return this.volumeCode === 0 ? 0 :
               this.volumeCode === 1 ? nibble :
               this.volumeCode === 2 ? nibble >> 1 :
               nibble >> 2;
    }
}

class NoiseChannel extends Channel {
    private static readonly DIVISORS = [8, 16, 32, 48, 64, 80, 96, 112];
    
    private lfsr: number = 0x7FFF;
    private divisorCode: number = 0;
    private shortMode: boolean = false;
    private volume: number = 0;
    private envelopePeriod: number = 0;
    private envelopeAdd: boolean = false;
    private envelopeTimer: number = 0;
    private shiftAmount: number = 0;

    public step(cycles: number): void {
        if (!this.enabled) return;
        
        this.timer -= cycles;
        if (this.timer <= 0) {
            this.timer += NoiseChannel.DIVISORS[this.divisorCode] << this.shiftAmount;
            
            const xor = (this.lfsr & 1) ^ ((this.lfsr >> 1) & 1);
            this.lfsr = (this.lfsr >> 1) | (xor << 14);
            if (this.shortMode) {
                this.lfsr = (this.lfsr & ~(1 << 7)) | (xor << 6);
            }
        }
    }

    public getSample(): number {
        if (!this.enabled) return 0;
        return ((this.lfsr & 1) ? 0 : 1) * this.volume;
    }

    public clockEnvelope(): void {
        if (this.envelopePeriod === 0) return;
        
        if (--this.envelopeTimer <= 0) {
            this.envelopeTimer = this.envelopePeriod;
            
            if (this.envelopeAdd && this.volume < 15) {
                this.volume++;
            } else if (!this.envelopeAdd && this.volume > 0) {
                this.volume--;
            }
        }
    }
}