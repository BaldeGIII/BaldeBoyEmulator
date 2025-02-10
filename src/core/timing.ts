export class Timing {
  private static readonly GB_CLOCK_SPEED = 4194304;
  private static readonly GB_FRAME_RATE = 59.727500569606;
  private static readonly CYCLES_PER_FRAME = Math.round(GB_CLOCK_SPEED / GB_FRAME_RATE);
  
  private cycleCount = 0;
  private frameCount = 0;
  
  public update(cycles: number): boolean {
    this.cycleCount += cycles;
    if (this.cycleCount >= Timing.CYCLES_PER_FRAME) {
      this.cycleCount -= Timing.CYCLES_PER_FRAME;
      this.frameCount++;
      return true; // New frame
    }
    return false;
  }
}
