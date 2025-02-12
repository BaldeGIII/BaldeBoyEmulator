import type { Memory } from "../core/memory"

export class PPU {
  // Updated VRAM for GBC's dual-bank system
  private vram: Uint8Array[] = [
    new Uint8Array(0x2000), // Bank 0
    new Uint8Array(0x2000)  // Bank 1
  ];
  private currentVRAMBank = 0;
  
  // GBC color palettes
  private bgPalettes = new Uint8Array(64);  // 8 palettes × 4 colors × 2 bytes
  private spritePalettes = new Uint8Array(64);  // 8 palettes × 4 colors × 2 bytes
  private bgPaletteIndex = 0;
  private spritePaletteIndex = 0;
  private bgPaletteAutoIncrement = false;
  private spritePaletteAutoIncrement = false;

  constructor(private memory: Memory) {
    this.oam = new Uint8Array(0xa0);
    this.frameBuffer = new Uint8ClampedArray(160 * 144 * 4);
    this.scanlineCounter = 0;
  }

  private getVRAMBank(): Uint8Array {
    return this.vram[this.currentVRAMBank];
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

  private getGBCColor(paletteData: Uint8Array, colorIndex: number): [number, number, number] {
    const index = colorIndex * 2;
    const low = paletteData[index];
    const high = paletteData[index + 1];
    const color = low | (high << 8);
    
    // Convert 5-bit GBC colors to 8-bit RGB
    const r = ((color & 0x1F) * 255 / 31) | 0;
    const g = (((color >> 5) & 0x1F) * 255 / 31) | 0;
    const b = (((color >> 10) & 0x1F) * 255 / 31) | 0;
    
    return [r, g, b];
  }

  private renderBackgroundGBC(ly: number): void {
    const lcdc = this.memory.read(0xFF40);
    const scrollY = this.memory.read(0xFF42);
    const scrollX = this.memory.read(0xFF43);
    const windowY = this.memory.read(0xFF4A);
    const windowX = this.memory.read(0xFF4B) - 7;

    const usingWindow = (lcdc & 0x20) !== 0 && windowY <= ly;
    const tileData = (lcdc & 0x10) !== 0 ? 0x8000 : 0x8800;
    let tileMap = (lcdc & 0x08) !== 0 ? 0x9C00 : 0x9800;
    
    if (usingWindow) {
      tileMap = (lcdc & 0x40) !== 0 ? 0x9C00 : 0x9800;
    }

    const y = usingWindow ? ly - windowY : scrollY + ly;
    const tileRow = ((y / 8) | 0) * 32;

    for (let px = 0; px < 160; px++) {
      const x = usingWindow && px >= windowX ? px - windowX : scrollX + px;
      const tileCol = (x / 8) | 0;
      
      // Get tile attributes from VRAM bank 1
      const tileAttrs = this.vram[1][tileMap - 0x8000 + tileRow + tileCol];
      const tileBankNum = (tileAttrs & 0x08) >> 3;
      const paletteNum = tileAttrs & 0x07;
      const xFlip = (tileAttrs & 0x20) !== 0;
      const yFlip = (tileAttrs & 0x40) !== 0;
      const priority = (tileAttrs & 0x80) !== 0;

      let tileNum = this.vram[0][tileMap - 0x8000 + tileRow + tileCol];
      const tileAddress = tileData + (tileNum * 16);
      
      // Get correct tile data based on attributes
      const tileDataBank = this.vram[tileBankNum];
      const tileY = yFlip ? 7 - (y % 8) : y % 8;
      const tileDataLow = tileDataBank[tileAddress + (tileY * 2)];
      const tileDataHigh = tileDataBank[tileAddress + (tileY * 2) + 1];

      const tileX = xFlip ? x % 8 : 7 - (x % 8);
      const colorNum = ((tileDataHigh >> tileX) & 1) << 1 | ((tileDataLow >> tileX) & 1);
      const color = this.getGBCColor(this.bgPalettes, paletteNum * 8 + colorNum * 2);

      const fbIndex = (ly * 160 + px) * 4;
      this.frameBuffer[fbIndex] = color[0];
      this.frameBuffer[fbIndex + 1] = color[1];
      this.frameBuffer[fbIndex + 2] = color[2];
      this.frameBuffer[fbIndex + 3] = 255;
    }
  }

  getFrameBuffer(): Uint8Array {
    // Implement the method to return the frame buffer
    // Assuming frameBuffer is a property of PPU that holds the frame data
    return this.frameBuffer;
  }
}