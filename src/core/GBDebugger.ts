import { CPUInstructionChecker } from './cpu_instructions';

export class GBDebugger {
    private static instance: GBDebugger;
    
    static getInstance(): GBDebugger {
      if (!this.instance) {
        this.instance = new GBDebugger();
      }
      return this.instance;
    }
  
    logROMInfo(romData: Uint8Array): { errors: string[] } {
      console.log('\x1b[36m%s\x1b[0m', '=== Game Boy ROM Info ===');
      console.log('Title:', this.getROMTitle(romData));
      console.log('Cartridge Type:', this.getCartridgeType(romData[0x147]));
      console.log('ROM Size:', this.getROMSize(romData[0x148]));
      console.log('RAM Size:', this.getRAMSize(romData[0x149]));
      console.log('GB Color Compatible:', this.isGBCCompatible(romData[0x143]));
      console.log('Super GB Functions:', (romData[0x146] === 0x03) ? 'Yes' : 'No');

      // Validate CPU instructions
      const validation = CPUInstructionChecker.validateROM(romData);
      if (!validation.valid) {
        console.log('\x1b[31m%s\x1b[0m', '=== CPU Implementation Errors ===');
        validation.errors.forEach(error => console.log('\x1b[31m-\x1b[0m', error));
      }

      return { errors: validation.errors };
    }
  
    logCPUState(cpu: any): void {
      console.log('\x1b[33m%s\x1b[0m', '=== CPU State ===');
      console.log(`PC: 0x${cpu.pc.toString(16).padStart(4, '0')}`);
      console.log(`SP: 0x${cpu.sp.toString(16).padStart(4, '0')}`);
      console.log(`A: 0x${cpu.a.toString(16).padStart(2, '0')}`);
      console.log(`F: ${this.getFlagStatus(cpu)}`);
      console.log(`BC: 0x${(cpu.b << 8 | cpu.c).toString(16).padStart(4, '0')}`);
      console.log(`DE: 0x${(cpu.d << 8 | cpu.e).toString(16).padStart(4, '0')}`);
      console.log(`HL: 0x${(cpu.h << 8 | cpu.l).toString(16).padStart(4, '0')}`);
    }
  
    private getROMTitle(romData: Uint8Array): string {
      return Array.from(romData.slice(0x134, 0x143))
        .map(char => String.fromCharCode(char))
        .join('')
        .replace(/\0/g, '');
    }
  
    private getCartridgeType(type: number): string {
      const types: { [key: number]: string } = {
        0x00: 'ROM ONLY',
        0x01: 'MBC1',
        0x02: 'MBC1+RAM',
        0x03: 'MBC1+RAM+BATTERY',
        0x05: 'MBC2',
        0x06: 'MBC2+BATTERY',
        0x08: 'ROM+RAM',
        0x09: 'ROM+RAM+BATTERY',
        0x0B: 'MMM01',
        0x0C: 'MMM01+RAM',
        0x0D: 'MMM01+RAM+BATTERY',
        0x0F: 'MBC3+TIMER+BATTERY',
        0x10: 'MBC3+TIMER+RAM+BATTERY',
        0x11: 'MBC3',
        0x12: 'MBC3+RAM',
        0x13: 'MBC3+RAM+BATTERY',
        0x19: 'MBC5',
        0x1A: 'MBC5+RAM',
        0x1B: 'MBC5+RAM+BATTERY',
        0x1C: 'MBC5+RUMBLE',
        0x1D: 'MBC5+RUMBLE+RAM',
        0x1E: 'MBC5+RUMBLE+RAM+BATTERY',
        0x20: 'MBC6',
        0x22: 'MBC7+SENSOR+RUMBLE+RAM+BATTERY',
        0xFC: 'POCKET CAMERA',
        0xFD: 'BANDAI TAMA5',
        0xFE: 'HuC3',
        0xFF: 'HuC1+RAM+BATTERY',
      };
      return types[type] || 'Unknown';
    }
  
    private getROMSize(size: number): string {
      const sizes: { [key: number]: string } = {
        0x00: '32KB',
        0x01: '64KB',
        0x02: '128KB',
        0x03: '256KB',
        0x04: '512KB',
        0x05: '1MB',
        0x06: '2MB',
        0x07: '4MB',
        0x08: '8MB',
      };
      return sizes[size] || 'Unknown';
    }
  
    private getRAMSize(size: number): string {
      const sizes: { [key: number]: string } = {
        0x00: 'None',
        0x01: '2KB',
        0x02: '8KB',
        0x03: '32KB',
        0x04: '128KB',
        0x05: '64KB',
      };
      return sizes[size] || 'Unknown';
    }
  
    private isGBCCompatible(value: number): string {
      if (value === 0x80) return 'GBC Compatible';
      if (value === 0xC0) return 'GBC Only';
      return 'GB Only';
    }
  
    private getFlagStatus(cpu: any): string {
      return `Z:${cpu.zeroFlag ? '1' : '0'} ` +
             `N:${cpu.subtractFlag ? '1' : '0'} ` +
             `H:${cpu.halfCarryFlag ? '1' : '0'} ` +
             `C:${cpu.carryFlag ? '1' : '0'}`;
    }
  }