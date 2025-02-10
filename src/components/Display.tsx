import { useRef, useEffect, useState, memo } from "react";
import type { EmulatorType } from "../core/emulator";

interface DisplayProps {
  emulator: EmulatorType | null;
  isKilled: boolean;
  scale: number;
}

const Display = memo<DisplayProps>(({ emulator, isKilled, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || isKilled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#9BBC0F";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    canvas.style.width = `${160 * scale}px`;
    canvas.style.height = `${144 * scale}px`;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setRenderError("Could not initialize canvas context");
      return;
    }

    ctx.fillStyle = "#9BBC0F";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!emulator || isKilled) return;

    let isActive = true;

    const renderFrame = () => {
      if (!isActive || !emulator || isKilled) return;

      try {
        emulator.executeFrame();
        const frameBuffer = emulator.getFrameBuffer();

        if (frameBuffer && frameBuffer.length === 160 * 144 * 4) {
          const imageData = new ImageData(
            new Uint8ClampedArray(frameBuffer),
            160,
            144
          );
          ctx.putImageData(imageData, 0, 0);
          setRenderError(null);
        }
      } catch (error) {
        console.error("Frame render error:", error);
        setRenderError("Display rendering failed");
      }

      if (!isKilled) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [emulator, isKilled, scale]);

  return (
    <div
      className="relative bg-gameboy-screen rounded-lg p-4 shadow-gameboy"
      style={{
        width: `${160 * scale}px`,
        height: `${144 * scale}px`,
        margin: "0 auto",
      }}
    >
      <canvas
        ref={canvasRef}
        width={160}
        height={144}
        className="w-full h-full"
        style={{
          imageRendering: "pixelated",
          backgroundColor: "#9BBC0F",
        }}
      />
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm p-2 text-center">
          {renderError}
        </div>
      )}
    </div>
  );
});

Display.displayName = "Display";
export default Display;