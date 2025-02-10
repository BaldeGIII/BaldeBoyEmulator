import { Memory } from "./memory";
import { CPU } from "./cpu";
import { PPU } from "./ppu";
import { APU } from "./apu";
import { ScreenScaler } from './screen-scaler';
import { Joypad } from "./joypad";

export type EmulatorButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select';

export interface EmulatorType {
  loadROM: (data: Uint8Array) => void;
  getFrameBuffer: () => Uint8Array;
  getAudioSamples: (numSamples: number) => Float32Array;
  setButtonPressed: (button: EmulatorButton) => void;
  setButtonReleased: (button: EmulatorButton) => void;
  setScreenSize: (width: number, height: number) => { width: number; height: number };
  getScreenCanvas: () => HTMLCanvasElement;
  setPixelated: (enabled: boolean) => void;
  setPalette: (palette: [number, number, number][]) => void;
  cleanup: () => void;
}

export class Emulator implements EmulatorType {
  private static readonly FRAMERATE = 59.727500569606;
  private cyclesPerFrame = Math.round(CPU.CLOCK_SPEED / Emulator.FRAMERATE);
  private memory: Memory;
  private cpu: CPU;
  private ppu: PPU;
  private apu: APU;
  private screenScaler: ScreenScaler;
  private joypad: Joypad; // Add Joypad
  // Approximate cycles per frame for GameBoy

  constructor() {
    this.memory = new Memory();
    this.cpu = new CPU(this.memory);
    this.ppu = new PPU(this.memory);
    this.apu = new APU();
    this.screenScaler = new ScreenScaler();
    this.joypad = new Joypad(this.memory); // Initialize Joypad
  }

  public loadROM(romData: Uint8Array): void {
    this.memory.loadROM(romData);
    this.cpu.reset();
    // Optionally reset other subsystems if needed.
  }

  public getFrameBuffer(): Uint8Array {
    // Convert Uint8ClampedArray to Uint8Array for consistency.
    return new Uint8Array(this.ppu.getFrameBuffer().buffer);
  }

  public getAudioSamples(size: number): Float32Array {
    return this.apu.getAudioBuffer(size);
  }

  public runFrame(): void {
    let cycles = 0;
    while (cycles < this.cyclesPerFrame) {
      const stepCycles = this.cpu.step();
      cycles += stepCycles;
      this.ppu.step(stepCycles);
      this.apu.step(stepCycles);
    }
    this.screenScaler.updateScreen(this.getFrameBuffer());
  }

  public setButtonPressed(button: EmulatorButton): void {
    this.joypad.setButtonPressed(button);
  }

  public setButtonReleased(button: EmulatorButton): void {
    this.joypad.setButtonReleased(button);
  }

  public setScreenSize(width: number, height: number): { width: number; height: number } {
    return this.screenScaler.setOutputSize(width, height);
  }

  public getScreenCanvas(): HTMLCanvasElement {
    return this.screenScaler.getCanvas();
  }

  public setPixelated(enabled: boolean): void {
    this.screenScaler.setScalingMode(enabled);
  }

  public setPalette(palette: [number, number, number][]): void {
    this.screenScaler.setPalette(palette);
  }
  
  public cleanup(): void {
    // Clear all memory
    this.memory = new Memory();
    this.cpu.reset();
    this.ppu = new PPU(this.memory);
    this.apu = new APU();
    this.screenScaler = new ScreenScaler();
    this.joypad = new Joypad(this.memory);
    
    // Force garbage collection of large arrays
    this.memory = undefined;
    this.cpu = undefined;
    this.ppu = undefined;
    this.apu = undefined;
    this.screenScaler = undefined;
    this.joypad = undefined;
  }
}

export const initEmulator = async (): Promise<EmulatorType> => {
  return new Emulator();
};

