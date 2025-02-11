import type { Memory } from "./memory"

export class Joypad {
  private buttons = 0xff
  private volumeLevel = 100;
  private contrastLevel = 50;

  constructor(private memory: Memory) {}

  public setButtonPressed(button: string): void {
    switch (button) {
      case "right":
        this.buttons &= ~0x01
        break
      case "left":
        this.buttons &= ~0x02
        break
      case "up":
        this.buttons &= ~0x04
        break
      case "down":
        this.buttons &= ~0x08
        break
      case "a":
        this.buttons &= ~0x10
        break
      case "b":
        this.buttons &= ~0x20
        break
      case "select":
        this.buttons &= ~0x40
        break
      case "start":
        this.buttons &= ~0x80
        break
    }
    this.updateJoypadRegister()
  }

  public setButtonReleased(button: string): void {
    switch (button) {
      case "right":
        this.buttons |= 0x01
        break
      case "left":
        this.buttons |= 0x02
        break
      case "up":
        this.buttons |= 0x04
        break
      case "down":
        this.buttons |= 0x08
        break
      case "a":
        this.buttons |= 0x10
        break
      case "b":
        this.buttons |= 0x20
        break
      case "select":
        this.buttons |= 0x40
        break
      case "start":
        this.buttons |= 0x80
        break
    }
    this.updateJoypadRegister()
  }

  public setVolume(level: number): void {
    this.volumeLevel = Math.max(0, Math.min(100, level));
    // Update audio output accordingly
  }

  public setContrast(level: number): void {
    this.contrastLevel = Math.max(0, Math.min(100, level));
    // Update display accordingly
  }

  private updateJoypadRegister(): void {
    let joypadState = this.memory.read(0xff00) & 0xf0;
    if ((joypadState & 0x10) === 0) {
      joypadState |= this.buttons & 0x0f;
    }
    if ((joypadState & 0x20) === 0) {
      joypadState |= (this.buttons >> 4) & 0x0f;
    }
    this.memory.write(0xff00, joypadState);

    // Trigger joypad interrupt if any button is pressed
    if (this.buttons !== 0xff) {
      const interruptFlags = this.memory.read(0xff0f);
      this.memory.write(0xff0f, interruptFlags | 0x10);
    }
  }
}

