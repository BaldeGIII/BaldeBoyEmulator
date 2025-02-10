import type { Memory } from "../core/memory"

export class PPU {
  private vram: Uint8Array
  private oam: Uint8Array
  private frameBuffer: Uint8ClampedArray
  private scanlineCounter = 0
  private sprites: number[][] = []

  constructor(private memory: Memory) {
    this.vram = new Uint8Array(0x2000)
    this.oam = new Uint8Array(0xa0)
    this.frameBuffer = new Uint8ClampedArray(160 * 144 * 4)
  }

  public step(cycles: number): void {
    this.scanlineCounter += cycles

    if (this.scanlineCounter >= 456) {
      this.scanlineCounter -= 456
      const ly = this.memory.read(0xff44)
      this.memory.write(0xff44, (ly + 1) % 154)

      if (ly < 144) {
        this.renderScanline(ly)
      } else if (ly === 144) {
        // V-Blank start
        // Trigger V-Blank interrupt
        const interruptFlags = this.memory.read(0xff0f)
        this.memory.write(0xff0f, interruptFlags | 0x01)
      }
    }
  }

  private renderScanline(ly: number): void {
    const lcdc = this.memory.read(0xff40)
    if (lcdc & 0x80) {
      this.renderBackground(ly)
      this.renderSprites(ly)
    }
  }

  private renderBackground(ly: number): void {
    const lcdc = this.memory.read(0xff40);
    const scrollY = this.memory.read(0xff42);
    const scrollX = this.memory.read(0xff43);
    const windowY = this.memory.read(0xff4a);
    const windowX = this.memory.read(0xff4b) - 7;

    const usingWindow = (lcdc & 0x20) !== 0 && windowY <= ly;
    const tileData = (lcdc & 0x10) !== 0 ? 0x8000 : 0x8800;
    let tileMap = (lcdc & 0x08) !== 0 ? 0x9c00 : 0x9800;
    if (usingWindow) {
      tileMap = (lcdc & 0x40) !== 0 ? 0x9c00 : 0x9800;
    }

    const y = usingWindow ? ly - windowY : scrollY + ly;
    const tileRow = Math.floor(y / 8) * 32;

    for (let px = 0; px < 160; px++) {
      const x = usingWindow && px >= windowX ? px - windowX : scrollX + px;
      const tileCol = Math.floor(x / 8);
      let tileNum = this.vram[tileMap - 0x8000 + tileRow + tileCol];

      if (tileData === 0x8800) {
        tileNum = (tileNum ^ 0x80) - 128;
      }

      const tileDataAddress = tileData + (tileNum * 16) + ((y % 8) * 2);
      const tileDataLow = this.vram[tileDataAddress - 0x8000];
      const tileDataHigh = this.vram[tileDataAddress + 1 - 0x8000];

      const colorBit = 7 - (x % 8);
      const colorNum = (((tileDataHigh >> colorBit) & 1) << 1) | ((tileDataLow >> colorBit) & 1);
      const color = this.getColor(colorNum, 0xff47);

      const fbIndex = (ly * 160 + px) * 4;
      this.frameBuffer[fbIndex] = color[0];
      this.frameBuffer[fbIndex + 1] = color[1];
      this.frameBuffer[fbIndex + 2] = color[2];
      this.frameBuffer[fbIndex + 3] = 255; // Alpha channel
    }
  }

  private renderSprites(ly: number): void {
    // Clear sprite buffer
    this.sprites = []
    
    // Collect visible sprites for this scanline
    for (let i = 0; i < 40; i++) {
      const index = i * 4
      const y = this.oam[index] - 16
      const x = this.oam[index + 1] - 8
      const tileIndex = this.oam[index + 2]
      const attributes = this.oam[index + 3]

      const tall = (this.memory.read(0xFF40) & 0x04) !== 0
      const height = tall ? 16 : 8

      if (y <= ly && y + height > ly) {
        this.sprites.push([x, y, tileIndex, attributes])
        if (this.sprites.length === 10) break // Hardware limit of 10 sprites per scanline
      }
    }

    // Sort sprites by x-coordinate (lower x = higher priority)
    this.sprites.sort((a, b) => a[0] - b[0])

    // Render sprites in priority order
    for (const [x, y, tileIndex, attributes] of this.sprites) {
      const yFlip = (attributes & 0x40) !== 0
      const xFlip = (attributes & 0x20) !== 0
      const palette = (attributes & 0x10) !== 0 ? 0xff49 : 0xff48

      const spriteHeight = (this.memory.read(0xFF40) & 0x04) !== 0 ? 16 : 8

      if (y <= ly && y + spriteHeight > ly) {
        const tileRow = yFlip ? spriteHeight - 1 - (ly - y) : ly - y
        const tileAddress = 0x8000 + tileIndex * 16 + tileRow * 2

        const tileDataLow = this.vram[tileAddress - 0x8000]
        const tileDataHigh = this.vram[tileAddress + 1 - 0x8000]

        for (let px = 0; px < 8; px++) {
          if (x + px >= 0 && x + px < 160) {
            const colorBit = xFlip ? px : 7 - px
            const colorNum = (((tileDataHigh >> colorBit) & 1) << 1) | ((tileDataLow >> colorBit) & 1)

            if (colorNum !== 0) {
              const color = this.getColor(colorNum, palette)
              const fbIndex = (ly * 160 + x + px) * 4
              this.frameBuffer[fbIndex] = color[0]
              this.frameBuffer[fbIndex + 1] = color[1]
              this.frameBuffer[fbIndex + 2] = color[2]
              this.frameBuffer[fbIndex + 3] = colorNum
            }
          }
        }
      }

      const priority = (attributes & 0x80) !== 0
      if (priority) {
        // Only render if background is color 0
        const bgPixel = this.frameBuffer[(ly * 160 + x) * 4 + 3]
        if (bgPixel === 0) {
          // ... render sprite pixel ...
        }
      } else {
        // Render sprite regardless of background
        // ... render sprite pixel ...
      }
    }
  }

  private getColor(colorNum: number, paletteAddress: number): [number, number, number] {
    const palette = this.memory.read(paletteAddress)
    const intensity = (palette >> (colorNum * 2)) & 3
    switch (intensity) {
      case 0:
        return [255, 255, 255]
      case 1:
        return [192, 192, 192]
      case 2:
        return [96, 96, 96]
      case 3:
        return [0, 0, 0]
      default:
        return [255, 255, 255] // default color
    }
  }

  public getFrameBuffer(): Uint8ClampedArray {
    return this.frameBuffer
  }
}

