import type { Memory } from "../core/memory"

export class CPU {
  private static readonly CLOCK_SPEED = 4194304;
  private a = 0
  private b = 0
  private c = 0
  private d = 0
  private e = 0
  private h = 0
  private l = 0
  private f = 0
  public sp = 0xfffe
  public pc = 0x0100
  private interruptMasterEnable = false
  private pendingEnableInterrupts = false
  private halted = false

  constructor(private memory: Memory) {}

  private get zeroFlag(): boolean {
    return (this.f & 0x80) !== 0
  }
  private set zeroFlag(value: boolean) {
    this.f = value ? this.f | 0x80 : this.f & 0x7f
  }

  private get subtractFlag(): boolean {
    return (this.f & 0x40) !== 0
  }
  private set subtractFlag(value: boolean) {
    this.f = value ? this.f | 0x40 : this.f & 0xbf
  }

  private get halfCarryFlag(): boolean {
    return (this.f & 0x20) !== 0
  }
  private set halfCarryFlag(value: boolean) {
    this.f = value ? this.f | 0x20 : this.f & 0xdf
  }

  private get carryFlag(): boolean {
    return (this.f & 0x10) !== 0
  }
  private set carryFlag(value: boolean) {
    this.f = value ? this.f | 0x10 : this.f & 0xef
  }

  public reset(): void {
    this.a = 0x01
    this.f = 0xb0
    this.b = 0x00
    this.c = 0x13
    this.d = 0x00
    this.e = 0xd8
    this.h = 0x01
    this.l = 0x4d
    this.sp = 0xfffe
    this.pc = 0x0100
  }

  public step(): number {
    if (this.halted) {
      if (this.checkInterrupts()) {
        this.halted = false
      }
      return 4
    }

    if (this.pendingEnableInterrupts) {
      this.interruptMasterEnable = true
      this.pendingEnableInterrupts = false
    }

    // Handle interrupts
    if (this.interruptMasterEnable && this.checkInterrupts()) {
      this.interruptMasterEnable = false
      this.halted = false
      return this.handleInterrupt()
    }

    const opcode = this.memory.read(this.pc++)
    return this.executeInstruction(opcode)
  }

  private checkInterrupts(): boolean {
    const ie = this.memory.read(0xFFFF)
    const if_ = this.memory.read(0xFF0F)
    return (ie & if_) !== 0
  }

  private handleInterrupt(): number {
    const ie = this.memory.read(0xFFFF)
    const if_ = this.memory.read(0xFF0F)
    const interrupt = ie & if_

    // Priority: VBlank (0), LCD (1), Timer (2), Serial (3), Joypad (4)
    let address = 0
    let bit = 0
    if (interrupt & 0x01) { address = 0x40; bit = 0 }
    else if (interrupt & 0x02) { address = 0x48; bit = 1 }
    else if (interrupt & 0x04) { address = 0x50; bit = 2 }
    else if (interrupt & 0x08) { address = 0x58; bit = 3 }
    else if (interrupt & 0x10) { address = 0x60; bit = 4 }

    // Clear interrupt flag
    this.memory.write(0xFF0F, if_ & ~(1 << bit))

    // Push PC to stack and jump to interrupt handler
    this.sp -= 2
    this.memory.write(this.sp, this.pc & 0xFF)
    this.memory.write(this.sp + 1, this.pc >> 8)
    this.pc = address

    return 20 // Interrupt handling takes 20 cycles
  }

  private executeInstruction(opcode: number): number {
    switch (opcode) {
      case 0x00:
        return this.nop()
      case 0x3e:
        return this.ld_a_n()
      case 0x06:
        return this.ld_b_n()
      case 0x0e:
        return this.ld_c_n()
      case 0x16:
        return this.ld_d_n()
      case 0x1e:
        return this.ld_e_n()
      case 0x26:
        return this.ld_h_n()
      case 0x2e:
        return this.ld_l_n()
      case 0x7f:
        return this.ld_a_a()
      case 0x78:
        return this.ld_a_b()
      case 0x79:
        return this.ld_a_c()
      case 0x7a:
        return this.ld_a_d()
      case 0x7b:
        return this.ld_a_e()
      case 0x7c:
        return this.ld_a_h()
      case 0x7d:
        return this.ld_a_l()
      case 0x80:
        return this.add_a_b()
      case 0x81:
        return this.add_a_c()
      case 0x82:
        return this.add_a_d()
      case 0x83:
        return this.add_a_e()
      case 0x84:
        return this.add_a_h()
      case 0x85:
        return this.add_a_l()
      case 0x86:
        return this.add_a_hl()
      case 0xc6:
        return this.add_a_n()
      case 0x90:
        return this.sub_b()
      case 0x91:
        return this.sub_c()
      case 0x92:
        return this.sub_d()
      case 0x93:
        return this.sub_e()
      case 0x94:
        return this.sub_h()
      case 0x95:
        return this.sub_l()
      case 0x96:
        return this.sub_hl()
      case 0xd6:
        return this.sub_n()
      case 0xa0:
        return this.and_b()
      case 0xa1:
        return this.and_c()
      case 0xa2:
        return this.and_d()
      case 0xa3:
        return this.and_e()
      case 0xa4:
        return this.and_h()
      case 0xa5:
        return this.and_l()
      case 0xa6:
        return this.and_hl()
      case 0xe6:
        return this.and_n()
      case 0xb0:
        return this.or_b()
      case 0xb1:
        return this.or_c()
      case 0xb2:
        return this.or_d()
      case 0xb3:
        return this.or_e()
      case 0xb4:
        return this.or_h()
      case 0xb5:
        return this.or_l()
      case 0xb6:
        return this.or_hl()
      case 0xf6:
        return this.or_n()
      case 0xc3:
        return this.jp_nn()
      case 0xaf:
        return this.xor_a()
      case 0x21:
        return this.ld_hl_nn()
      case 0x32:
        return this.ld_hld_a()
      case 0x20:
        return this.jr_nz_n()
      case 0x31:
        return this.ld_sp_nn()
      case 0xe0:
        return this.ldh_n_a()
      case 0xf0:
        return this.ldh_a_n()
      case 0xfe:
        return this.cp_n()
      case 0xea:
        return this.ld_nn_a()
      case 0x1a:
        return this.ld_a_de()
      case 0xcd:
        return this.call_nn()
      case 0xc9:
        return this.ret()
      case 0x76: // HALT
        this.halted = true
        return 4
      case 0xF3: // DI
        this.interruptMasterEnable = false
        return 4
      case 0xFB: // EI
        this.pendingEnableInterrupts = true
        return 4
      case 0x27:
        return this.daa();
      case 0x10:
        return this.stop();
      default:
        console.warn(`Unknown opcode: 0x${opcode.toString(16)}`)
        return 4 // Assume 4 cycles for unknown opcodes
    }
  }

  private nop(): number {
    return 4
  }

  private ld_a_n(): number {
    this.a = this.memory.read(this.pc++)
    return 8
  }

  private ld_b_n(): number {
    this.b = this.memory.read(this.pc++)
    return 8
  }

  private ld_c_n(): number {
    this.c = this.memory.read(this.pc++)
    return 8
  }

  private ld_d_n(): number {
    this.d = this.memory.read(this.pc++)
    return 8
  }

  private ld_e_n(): number {
    this.e = this.memory.read(this.pc++)
    return 8
  }

  private ld_h_n(): number {
    this.h = this.memory.read(this.pc++)
    return 8
  }

  private ld_l_n(): number {
    this.l = this.memory.read(this.pc++)
    return 8
  }

  private ld_a_a(): number {
    return 4
  }

  private ld_a_b(): number {
    this.a = this.b
    return 4
  }

  private ld_a_c(): number {
    this.a = this.c
    return 4
  }

  private ld_a_d(): number {
    this.a = this.d
    return 4
  }

  private ld_a_e(): number {
    this.a = this.e
    return 4
  }

  private ld_a_h(): number {
    this.a = this.h
    return 4
  }

  private ld_a_l(): number {
    this.a = this.l
    return 4
  }

  private add_a_b(): number {
    this.add(this.b)
    return 4
  }

  private add_a_c(): number {
    this.add(this.c)
    return 4
  }

  private add_a_d(): number {
    this.add(this.d)
    return 4
  }

  private add_a_e(): number {
    this.add(this.e)
    return 4
  }

  private add_a_h(): number {
    this.add(this.h)
    return 4
  }

  private add_a_l(): number {
    this.add(this.l)
    return 4
  }

  private add_a_hl(): number {
    const value = this.memory.read((this.h << 8) | this.l)
    this.add(value)
    return 8
  }

  private add_a_n(): number {
    const value = this.memory.read(this.pc++)
    this.add(value)
    return 8
  }

  private add(value: number): void {
    const result = this.a + value
    this.zeroFlag = (result & 0xff) === 0
    this.subtractFlag = false
    this.halfCarryFlag = (this.a & 0xf) + (value & 0xf) > 0xf
    this.carryFlag = result > 0xff
    this.a = result & 0xff
  }

  private sub_b(): number {
    this.sub(this.b)
    return 4
  }

  private sub_c(): number {
    this.sub(this.c)
    return 4
  }

  private sub_d(): number {
    this.sub(this.d)
    return 4
  }

  private sub_e(): number {
    this.sub(this.e)
    return 4
  }

  private sub_h(): number {
    this.sub(this.h)
    return 4
  }

  private sub_l(): number {
    this.sub(this.l)
    return 4
  }

  private sub_hl(): number {
    const value = this.memory.read((this.h << 8) | this.l)
    this.sub(value)
    return 8
  }

  private sub_n(): number {
    const value = this.memory.read(this.pc++)
    this.sub(value)
    return 8
  }

  private sub(value: number): void {
    const result = this.a - value
    this.zeroFlag = (result & 0xff) === 0
    this.subtractFlag = true
    this.halfCarryFlag = (this.a & 0xf) - (value & 0xf) < 0
    this.carryFlag = result < 0
    this.a = result & 0xff
  }

  private and_b(): number {
    this.and(this.b)
    return 4
  }

  private and_c(): number {
    this.and(this.c)
    return 4
  }

  private and_d(): number {
    this.and(this.d)
    return 4
  }

  private and_e(): number {
    this.and(this.e)
    return 4
  }

  private and_h(): number {
    this.and(this.h)
    return 4
  }

  private and_l(): number {
    this.and(this.l)
    return 4
  }

  private and_hl(): number {
    const value = this.memory.read((this.h << 8) | this.l)
    this.and(value)
    return 8
  }

  private and_n(): number {
    const value = this.memory.read(this.pc++)
    this.and(value)
    return 8
  }

  private and(value: number): void {
    this.a &= value
    this.zeroFlag = this.a === 0
    this.subtractFlag = false
    this.halfCarryFlag = true
    this.carryFlag = false
  }

  private or_b(): number {
    this.or(this.b)
    return 4
  }

  private or_c(): number {
    this.or(this.c)
    return 4
  }

  private or_d(): number {
    this.or(this.d)
    return 4
  }

  private or_e(): number {
    this.or(this.e)
    return 4
  }

  private or_h(): number {
    this.or(this.h)
    return 4
  }

  private or_l(): number {
    this.or(this.l)
    return 4
  }

  private or_hl(): number {
    const value = this.memory.read((this.h << 8) | this.l)
    this.or(value)
    return 8
  }

  private or_n(): number {
    const value = this.memory.read(this.pc++)
    this.or(value)
    return 8
  }

  private or(value: number): void {
    this.a |= value
    this.zeroFlag = this.a === 0
    this.subtractFlag = false
    this.halfCarryFlag = false
    this.carryFlag = false
  }

  private jp_nn(): number {
    const low = this.memory.read(this.pc++)
    const high = this.memory.read(this.pc++)
    this.pc = (high << 8) | low
    return 16
  }

  private xor_a(): number {
    this.a ^= this.a
    this.zeroFlag = this.a === 0
    this.subtractFlag = false
    this.halfCarryFlag = false
    this.carryFlag = false
    return 4
  }

  private ld_hl_nn(): number {
    const low = this.memory.read(this.pc++)
    const high = this.memory.read(this.pc++)
    this.l = low
    this.h = high
    return 12
  }

  private ld_hld_a(): number {
    const hl = (this.h << 8) | this.l
    this.memory.write(hl, this.a)
    this.l = (this.l - 1) & 0xff
    if (this.l === 0xff) this.h = (this.h - 1) & 0xff
    return 8
  }

  private jr_nz_n(): number {
    const offset = this.memory.read(this.pc++)
    if (!this.zeroFlag) {
      this.pc += offset < 128 ? offset : offset - 256
      return 12
    }
    return 8
  }

  private ld_sp_nn(): number {
    const low = this.memory.read(this.pc++)
    const high = this.memory.read(this.pc++)
    this.sp = (high << 8) | low
    return 12
  }

  private ldh_n_a(): number {
    const offset = this.memory.read(this.pc++)
    this.memory.write(0xff00 + offset, this.a)
    return 12
  }

  private ldh_a_n(): number {
    const offset = this.memory.read(this.pc++)
    this.a = this.memory.read(0xff00 + offset)
    return 12
  }

  private cp_n(): number {
    const value = this.memory.read(this.pc++)
    const result = this.a - value
    this.zeroFlag = result === 0
    this.subtractFlag = true
    this.halfCarryFlag = (this.a & 0xf) < (value & 0xf)
    this.carryFlag = this.a < value
    return 8
  }

  private ld_nn_a(): number {
    const low = this.memory.read(this.pc++)
    const high = this.memory.read(this.pc++)
    const address = (high << 8) | low
    this.memory.write(address, this.a)
    return 16
  }

  private ld_a_de(): number {
    const address = (this.d << 8) | this.e
    this.a = this.memory.read(address)
    return 8
  }

  private call_nn(): number {
    const low = this.memory.read(this.pc++)
    const high = this.memory.read(this.pc++)
    this.sp -= 2
    this.memory.write(this.sp, this.pc & 0xff)
    this.memory.write(this.sp + 1, this.pc >> 8)
    this.pc = (high << 8) | low
    return 24
  }

  private ret(): number {
    this.pc = this.memory.read(this.sp) | (this.memory.read(this.sp + 1) << 8)
    this.sp += 2
    return 16
  }

  private daa(): number {
    // Decimal adjust instruction specific to GB CPU
    let correction = 0;
    if (this.halfCarryFlag || (!this.subtractFlag && (this.a & 0x0F) > 9)) {
      correction |= 0x06;
    }
    if (this.carryFlag || (!this.subtractFlag && this.a > 0x99)) {
      correction |= 0x60;
      this.carryFlag = true;
    }
    this.a += this.subtractFlag ? -correction : correction;
    this.a &= 0xFF;
    this.zeroFlag = this.a === 0;
    this.halfCarryFlag = false;
    return 4;
  }

  private stop(): number {
    // STOP instruction specific to GB CPU
    // Implementation here
    return 4;
  }
}

