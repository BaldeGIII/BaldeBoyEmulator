export class ColorPalette {
    private static readonly COLORS_PER_PALETTE = 4;
    private static readonly PALETTES_COUNT = 8;
    
    // GBC color conversion (5-bit to 8-bit)
    private static convert5to8(color5: number): number {
      return Math.round((color5 * 255) / 31);
    }
  
    public static convertGBCColor(color16: number): [number, number, number] {
      const r = ColorPalette.convert5to8((color16 >> 0) & 0x1F);
      const g = ColorPalette.convert5to8((color16 >> 5) & 0x1F);
      const b = ColorPalette.convert5to8((color16 >> 10) & 0x1F);
      return [r, g, b];
    }
  
    public getPaletteColor(paletteData: number[], index: number): [number, number, number] {
      const color16 = paletteData[index * 2] | (paletteData[index * 2 + 1] << 8);
      return ColorPalette.convertGBCColor(color16);
    }
  }