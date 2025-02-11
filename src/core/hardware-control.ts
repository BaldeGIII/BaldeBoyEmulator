export class HardwareControl {
  private static readonly DEFAULT_VOLUME = 7;
  private static readonly DEFAULT_CONTRAST = 15;
  
  private volume: number = HardwareControl.DEFAULT_VOLUME;
  private contrast: number = HardwareControl.DEFAULT_CONTRAST;
  
  public adjustVolume(value: number): void {
    this.volume = Math.max(0, Math.min(7, value));
    this.apu.setMasterVolume(this.volume / 7); // Normalize to 0-1 range
  }
  
  public adjustContrast(value: number): void {
    this.contrast = Math.max(0, Math.min(15, value));
    const contrastFactor = 0.7 + (this.contrast / 15) * 0.6; // Range 0.7-1.3
    this.ppu.setContrastFactor(contrastFactor);
  }
}
