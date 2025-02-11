export class ScreenScaler {
  // GameBoy's original resolution
  private static readonly ORIGINAL_WIDTH = 160;
  private static readonly ORIGINAL_HEIGHT = 144;
  private static readonly ASPECT_RATIO = 10 / 9;

  private scaledCanvas: HTMLCanvasElement;
  private scaledContext: CanvasRenderingContext2D;
  private originalCanvas: HTMLCanvasElement;
  private originalContext: CanvasRenderingContext2D;

  constructor() {
    this.originalCanvas = document.createElement('canvas');
    this.originalCanvas.width = ScreenScaler.ORIGINAL_WIDTH;
    this.originalCanvas.height = ScreenScaler.ORIGINAL_HEIGHT;
    this.originalContext = this.originalCanvas.getContext('2d') as CanvasRenderingContext2D;

    this.scaledCanvas = document.createElement('canvas');
    this.scaledContext = this.scaledCanvas.getContext('2d', {
      alpha: false,
      antialias: false,
    }) as CanvasRenderingContext2D;

    // Disable image smoothing for crisp pixel art
    this.scaledContext.imageSmoothingEnabled = false;
  }

  /**
   * Set the size of the output canvas
   * @param width Desired width
   * @param height Desired height
   * @returns Object containing the actual width and height used
   */
  public setOutputSize(width: number, height: number): { width: number; height: number } {
    const targetAspectRatio = width / height;
    let finalWidth: number;
    let finalHeight: number;

    if (targetAspectRatio > ScreenScaler.ASPECT_RATIO) {
      // Width is too wide, base calculations on height
      finalHeight = height;
      finalWidth = height * ScreenScaler.ASPECT_RATIO;
    } else {
      // Height is too tall, base calculations on width
      finalWidth = width;
      finalHeight = width / ScreenScaler.ASPECT_RATIO;
    }

    this.scaledCanvas.width = finalWidth;
    this.scaledCanvas.height = finalHeight;
    this.scaledContext.imageSmoothingEnabled = false;

    return { width: finalWidth, height: finalHeight };
  }

  /**
   * Update the screen with new frame data
   * @param frameBuffer The raw frame buffer from the emulator (160x144 pixels)
   */
  public updateScreen(frameBuffer: Uint8Array): void {
    const imageData = this.originalContext.createImageData(
      ScreenScaler.ORIGINAL_WIDTH,
      ScreenScaler.ORIGINAL_HEIGHT
    );
    imageData.data.set(frameBuffer);
    this.originalContext.putImageData(imageData, 0, 0);

    // Scale the original canvas to the scaled canvas
    this.scaledContext.drawImage(
      this.originalCanvas,
      0,
      0,
      this.scaledCanvas.width,
      this.scaledCanvas.height
    );
  }

  /**
   * Get the scaled canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.scaledCanvas;
  }

  /**
   * Set scaling mode
   * @param pixelated If true, uses nearest-neighbor scaling for sharp pixels
   */
  public setScalingMode(pixelated: boolean): void {
    this.scaledContext.imageSmoothingEnabled = !pixelated;
  }

  /**
   * Apply a color palette to the screen
   * @param palette Array of RGB colors to use
   */
  public setPalette(palette: [number, number, number][]): void {
    // Create a temporary canvas for palette mapping
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = ScreenScaler.ORIGINAL_WIDTH;
    tempCanvas.height = ScreenScaler.ORIGINAL_HEIGHT;
    const tempContext = tempCanvas.getContext('2d')!;
    
    // Get image data from the original canvas
    const imageData = this.originalContext.getImageData(
      0,
      0,
      ScreenScaler.ORIGINAL_WIDTH,
      ScreenScaler.ORIGINAL_HEIGHT
    );

    // Map the colors based on the palette
    for (let i = 0; i < imageData.data.length; i += 4) {
      const colorIndex = imageData.data[i]; // Use the red channel as the color index
      const [r, g, b] = palette[colorIndex % palette.length];
      imageData.data[i] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
      imageData.data[i + 3] = 255; // Alpha channel
    }

    // Put the modified image data back into the temporary canvas
    tempContext.putImageData(imageData, 0, 0);

    // Draw the temporary canvas onto the scaled canvas
    this.scaledContext.drawImage(
      tempCanvas,
      0,
      0,
      this.scaledCanvas.width,
      this.scaledCanvas.height
    );
  }
}
