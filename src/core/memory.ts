export class Memory {
  private rom: Uint8Array
  private ram: Uint8Array
  private vram: Uint8Array
  private oam: Uint8Array
  private io: Uint8Array
  private hram: Uint8Array

  private mbc1: boolean = false
  private romBank: number = 1
  private ramEnabled: boolean = false
  private ramBank: number = 0
  private cartridgeRam: Uint8Array = new Uint8Array(0x8000)

  constructor() {
    this.rom = new Uint8Array(0x8000) // 32KB
    this.ram = new Uint8Array(0x2000) // 8KB
    this.vram = new Uint8Array(0x2000) // 8KB
    this.oam = new Uint8Array(0xa0) // 160B
    this.io = new Uint8Array(0x80) // 128B
    this.hram = new Uint8Array(0x7f) // 127B
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

  public write(address: number, value: number): void {
    if (address < 0x8000) {
      if (this.mbc1) {
        if (address < 0x2000) {
          this.ramEnabled = (value & 0x0F) === 0x0A
        } else if (address < 0x4000) {
          this.romBank = (value & 0x1F) || 1
        } else if (address < 0x6000) {
          this.ramBank = value & 0x03
        } else {
        }
      }
    } else if (address < 0xa000) {
      this.vram[address - 0x8000] = value
    } else if (address < 0xc000) {
      if (this.ramEnabled) {
        const ramAddress = this.ramBank * 0x2000 + (address - 0xa000)
        this.cartridgeRam[ramAddress] = value
      }
    } else if (address < 0xe000) {
      this.ram[address - 0xc000] = value
    } else if (address < 0xfe00) {
      // Echo RAM
      this.ram[address - 0xe000] = value
    } else if (address < 0xfea0) {
      this.oam[address - 0xfe00] = value
    } else if (address < 0xff00) {
      // Unused
    } else if (address < 0xff80) {
      this.io[address - 0xff00] = value
    } else if (address < 0xffff) {
      this.hram[address - 0xff80] = value
    } else {
      // Interrupt Enable Register
      this.io[0x7f] = value
    }
  }
}

