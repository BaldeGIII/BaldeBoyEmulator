import { useRef, useEffect, useState, memo } from "react";
import type { EmulatorType } from "../core/emulator";

interface DisplayProps {
  emulator: EmulatorType | null;
  isKilled: boolean;
  scale: number;
  debugErrors?: string[]; // Add this prop
}

interface DebugInfo {
  cpuState: {
    pc: number;
    sp: number;
    registers: { [key: string]: number };
    flags: { [key: string]: boolean };
    currentOpcode: number;
  };
  fps: number;
  frameCount: number;
}

const Display = memo<DisplayProps>(
  ({ emulator, isKilled, scale, debugErrors }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const lastFrameTime = useRef(performance.now());
    const frameCount = useRef(0);

    useEffect(() => {
      if (!canvasRef.current || isKilled) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: false });

      if (!ctx) {
        setRenderError("Could not initialize canvas context");
        return;
      }

      ctx.imageSmoothingEnabled = false;

      let isActive = true;

      const renderFrame = () => {
        if (!isActive || !emulator || isKilled) return;

        try {
          // Execute frame and get debug info
          emulator.runFrame();
          const frameBuffer = emulator.getFrameBuffer();
          const cpuState = emulator.getCPUState();

          // Calculate FPS
          const now = performance.now();
          const delta = now - lastFrameTime.current;
          frameCount.current++;

          if (delta >= 1000) {
            const fps = (frameCount.current * 1000) / delta;
            setDebugInfo((prev) => ({
              ...prev!,
              fps,
              frameCount: frameCount.current,
              cpuState,
            }));
            frameCount.current = 0;
            lastFrameTime.current = now;
          }

          // Render frame buffer
          if (frameBuffer && frameBuffer.length === 160 * 144 * 4) {
            const imageData = new ImageData(
              new Uint8ClampedArray(frameBuffer),
              160,
              144
            );
            ctx.putImageData(imageData, 0, 0);

            // Log debug info to the console
            if (debugInfo) {
              console.log("Debug Info:", debugInfo);
            }

            setRenderError(null);
          }
        } catch (error) {
          console.error("Frame render error:", error);
          setRenderError(`Display rendering failed: ${error.message}`);
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
    }, [emulator, isKilled, scale, debugInfo]);

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
          className="absolute top-4 left-4"
          style={{
            imageRendering: "pixelated",
            width: `${160 * scale}px`,
            height: `${144 * scale}px`,
          }}
        />
        {debugErrors && debugErrors.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-sm p-4 text-center">
            <h3 className="text-red-500 font-bold mb-2">
              CPU Implementation Errors
            </h3>
            <div className="max-h-[80%] overflow-y-auto">
              {debugErrors.map((error, index) => (
                <p key={index} className="mb-1">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}
        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm p-2 text-center">
            {renderError}
            <button
              className="ml-2 px-2 py-1 bg-red-500 rounded"
              onClick={() => setRenderError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }
);

Display.displayName = "Display";
export default Display;