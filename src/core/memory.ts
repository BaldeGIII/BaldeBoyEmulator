export class Memory {
  // Updated memory sizes for GBC
  private bootRom: Uint8Array = new Uint8Array(0x900); // 2KB + 256B
  private vram: Uint8Array[] = [
    new Uint8Array(0x2000), // Bank 0
    new Uint8Array(0x2000)  // Bank 1
  ];
  private wram: Uint8Array[] = [
    new Uint8Array(0x1000), // Bank 0
    new Uint8Array(0x1000), // Bank 1
    new Uint8Array(0x1000), // Bank 2
    new Uint8Array(0x1000), // Bank 3
    new Uint8Array(0x1000), // Bank 4
    new Uint8Array(0x1000), // Bank 5
    new Uint8Array(0x1000), // Bank 6
    new Uint8Array(0x1000)  // Bank 7
  ];
  private currentVRAMBank = 0;
  private currentWRAMBank = 1;

  // GBC palette memory
  private bgPalettes = new Uint8Array(0x40);
  private spritePalettes = new Uint8Array(0x40);
  private bgPaletteIndex = 0;
  private spritePaletteIndex = 0;
  private bgPaletteAutoIncrement = false;
  private spritePaletteAutoIncrement = false;
  
  constructor() {
    this.rom = new Uint8Array(0x8000) // 32KB
    this.ram = new Uint8Array(0x2000) // 8KB
    this.vram = new Uint8Array(0x2000) // 8KB
    this.oam = new Uint8Array(0xa0) // 160B
    this.io = new Uint8Array(0x80) // 128B
    this.hram = new Uint8Array(0x7f) // 127B
  }

  public write(address: number, value: number): void {
    switch (address & 0xF000) {
      case 0x8000: // VRAM
      case 0x9000:
        this.vram[this.currentVRAMBank][address & 0x1FFF] = value;
        break;
      case 0xD000: // WRAM banks 1-7
        this.wram[this.currentWRAMBank][address & 0x0FFF] = value;
        break;
      case 0xFF00: // I/O registers
        if (address === 0xFF4F) { // VBK - VRAM Bank
          this.currentVRAMBank = value & 0x01;
        } else if (address === 0xFF70) { // SVBK - WRAM Bank
          this.currentWRAMBank = value & 0x07 || 1;
        } else if (address === 0xFF68) { // BCPS/BGPI - Background Palette Index
          this.bgPaletteIndex = value & 0x3F;
          this.bgPaletteAutoIncrement = !!(value & 0x80);
        } else if (address === 0xFF69) { // BCPD/BGPD - Background Palette Data
          this.writeBGPalette(value);
        } else if (address === 0xFF6A) { // OCPS/OBPI - Sprite Palette Index
          this.spritePaletteIndex = value & 0x3F;
          this.spritePaletteAutoIncrement = !!(value & 0x80);
        } else if (address === 0xFF6B) { // OCPD/OBPD - Sprite Palette Data
          this.writeSpritePalette(value);
        }
        // ... handle other I/O registers
        break;
    }
  }

  private writeBGPalette(value: number): void {
    this.bgPalettes[this.bgPaletteIndex] = value;
    if (this.bgPaletteAutoIncrement) {
      this.bgPaletteIndex = (this.bgPaletteIndex + 1) & 0x3F;
    }
  }

  private writeSpritePalette(value: number): void {
    this.spritePalettes[this.spritePaletteIndex] = value;
    if (this.spritePaletteAutoIncrement) {
      this.spritePaletteIndex = (this.spritePaletteIndex + 1) & 0x3F;
    }
  }

  public loadROM(data: Uint8Array): void {
    this.rom = new Uint8Array(0x200000) // Support up to 2MB ROMs
    this.rom.set(data)
    
    // Detect MBC type
    const cartridgeType = data[0x147]
    this.mbc1 = cartridgeType >= 0x01 && cartridgeType <= 0x03
  }

  public read(address: number): number {
    if (address < 0x4000) {
      return this.rom[address]
    } else if (address < 0x8000) {
      const bank = this.mbc1 ? this.romBank : 1
      return this.rom[bank * 0x4000 + (address - 0x4000)]
    } else if (address < 0xa000) {
      return this.vram[address - 0x8000]
    } else if (address < 0xc000) {
      if (this.ramEnabled) {
        const ramAddress = this.ramBank * 0x2000 + (address - 0xa000)
        return this.cartridgeRam[ramAddress]
      }
      return 0xFF
    } else if (address < 0xe000) {
      return this.ram[address - 0xc000]
    } else if (address < 0xfe00) {
      // Echo RAM
      return this.ram[address - 0xe000]
    } else if (address < 0xfea0) {
      return this.oam[address - 0xfe00]
    } else if (address < 0xff00) {
      // Unused
      return 0
    } else if (address < 0xff80) {
      return this.io[address - 0xff00]
    } else if (address < 0xffff) {
      return this.hram[address - 0xff80]
    } else {
      // Interrupt Enable Register
      return this.io[0x7f]
    }
  }
  
  public dmaTransfer(start: number): void {
    // Standard DMA transfer
    const sourceAddr = start << 8;
    for (let i = 0; i < 0xA0; i++) {
      this.oam[i] = this.read(sourceAddr + i);
    }
  }

  public hdmaTransfer(source: number, dest: number, length: number, hblank: boolean): void {
    // GBC HDMA/GDMA transfer
    const sourceAddr = (source & 0xFFF0) | ((dest & 0x1FF0) << 12);
    const destAddr = 0x8000 | (dest & 0x1FF0);
    
    if (hblank) {
      // HDMA: Transfer one block per H-Blank
      this.hdmaActive = true;
      this.hdmaSource = sourceAddr;
      this.hdmaDest = destAddr;
      this.hdmaLength = length;
    } else {
      // GDMA: Transfer all at once
      for (let i = 0; i < length * 0x10; i++) {
        this.write(destAddr + i, this.read(sourceAddr + i));
      }
    }
  }

  public updateHDMA(): void {
    if (this.hdmaActive && this.ppu.isHBlank()) {
      // Transfer one block during H-Blank
      for (let i = 0; i < 0x10; i++) {
        this.write(this.hdmaDest++, this.read(this.hdmaSource++));
      }
      
      this.hdmaLength--;
      if (this.hdmaLength === 0) {
        this.hdmaActive = false;
      }
    }
  }
}