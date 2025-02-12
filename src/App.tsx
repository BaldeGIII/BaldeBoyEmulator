import React, { memo, useState, useCallback } from "react";
import { initEmulator, type EmulatorType } from "./core/emulator";
import { CPU } from "./core/cpu";
import Display from "./components/Display";
import Controls from "./components/Controls";
import ErrorBoundary from "./components/ErrorBoundary";
import Audio from "./components/Audio";
import type { EmulatorSettings } from "./types/types";
import MainMenu from "./components/MainMenu";

/**
 * Main Application Component
 * Orchestrates all emulator components and manages global state.
 *
 * Features:
 * - Emulator initialization and lifecycle management
 * - ROM loading and error handling
 * - Settings management
 * - Display scaling
 * - Component coordination
 */
const App = memo(() => {
  const [emulator, setEmulator] = useState<EmulatorType | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<EmulatorSettings>({
    gbModeOverGbc: true,
    useBiosRom: false,
    overrideCartridgeType: false,
    allowMbcBankAccess: true,
    colorizeGameboyPalettes: true,
    minimalFullscreen: false,
    resizeCanvasDirectly: true,
    disallowTypedArrays: false,
    useDmgBootRom: false,
    smoothResizing: false,
    enableChannel1: true,
    enableChannel2: true,
    enableChannel3: true,
    enableChannel4: true,
  });
  const [scale, setScale] = useState(2);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = (error: Error) => {
    console.error("Emulator error:", error);
    return (
      <div className="min-h-screen bg-gameboy-bg flex items-center justify-center">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>The emulator encountered an error. Please refresh the page.</p>
        </div>
      </div>
    );
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);

      try {
        const newEmulator = await initEmulator();
        const arrayBuffer = await file.arrayBuffer();
        const romData = new Uint8Array(arrayBuffer);

        await newEmulator.loadROM(romData);
        newEmulator.setScreenSize(160, 144);
        newEmulator.setPixelated(true);

        setEmulator(newEmulator);
        setIsRunning(true);
      } catch (err) {
        setError("Failed to load ROM file. Please try another file.");
        console.error("ROM loading error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSettingChange = useCallback(
    (setting: keyof EmulatorSettings, value: boolean) => {
      setSettings((prev) => ({ ...prev, [setting]: value }));
      if (emulator) {
        emulator.updateSetting(setting, value);
      }
    },
    [emulator]
  );

  const handleRequestFullscreen = useCallback(() => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  }, []);

  const handleSetScale = useCallback((newScale: number) => {
    setScale(newScale);
  }, []);

  return (
    <ErrorBoundary fallback={handleError}>
      <div className="h-screen overflow-hidden bg-matrix flex flex-col">
        <div className="w-full bg-black/95 border-b border-red-500/30 relative z-50">
          <MainMenu
            onLoadROM={handleFileChange}
            settings={settings}
            onSettingChange={handleSettingChange}
            onRequestFullscreen={handleRequestFullscreen}
            onSetScale={handleSetScale}
            isRunning={isRunning}
            onToggleRun={() => setIsRunning(!isRunning)}
            onKillEmulation={() => {
              setEmulator(null);
              setIsRunning(false);
            }}
          />
        </div>

        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black flex items-center justify-center">
            <div
              className="h-full flex items-center justify-center p-8"
              style={{
                maxHeight: "calc(100vh - 120px)", // Account for header and controls
              }}
            >
              <div
                className="relative transform-gpu"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                  maxHeight: "100%",
                }}
              >
                <div
                  className="rounded-lg overflow-hidden border-2 border-red-500/50"
                  style={{
                    boxShadow: `
                      0 0 20px rgba(220, 38, 38, 0.2),
                      0 0 40px rgba(220, 38, 38, 0.1)
                    `,
                  }}
                >
                  <Display
                    emulator={emulator}
                    isKilled={!isRunning}
                    scale={scale}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Controls emulator={emulator} isRunning={isRunning} />
      </div>
    </ErrorBoundary>
  );
});

App.displayName = "App";
export default App;
