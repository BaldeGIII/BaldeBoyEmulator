export class PowerManagement {
  private powerState: 'running' | 'stopped' | 'halted' = 'running';
  
  public stop(): void {
    this.powerState = 'stopped';
    // Stop all clocks except external oscillator
    this.cpu.stopClock();
    this.timer.stopAllClocks();
    // Only wake up on button press interrupt
    this.interruptManager.enableButtonInterruptOnly();
  }
  
  public halt(): void {
    this.powerState = 'halted';
    // Stop CPU clock but keep other clocks running
    this.cpu.haltClock();
    // Wake on any enabled interrupt
    this.interruptManager.preserveInterruptState();
  }
  
  public wake(source: 'button' | 'interrupt'): void {
    if (this.powerState === 'stopped' && source === 'button' ||
        this.powerState === 'halted' && source === 'interrupt') {
      this.powerState = 'running';
    }
  }
}
