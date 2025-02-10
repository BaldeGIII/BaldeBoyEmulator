export class PowerManagement {
  private powerState: 'running' | 'stopped' | 'halted' = 'running';
  
  public stop(): void {
    this.powerState = 'stopped';
    // Stop CPU clock until button press
  }
  
  public halt(): void {
    this.powerState = 'halted';
    // Stop CPU until interrupt
  }
  
  public wake(source: 'button' | 'interrupt'): void {
    if (this.powerState === 'stopped' && source === 'button' ||
        this.powerState === 'halted' && source === 'interrupt') {
      this.powerState = 'running';
    }
  }
}
