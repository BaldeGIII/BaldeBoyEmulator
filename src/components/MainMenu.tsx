import React, { useState } from "react";
import type { EmulatorSettings } from "../types/types";
import { GBDebugger } from "../core/GBDebugger";

/**
 * Props interface for the MainMenu component
 * @property onLoadROM - Handler for ROM file loading
 * @property settings - Current emulator settings
 * @property onSettingChange - Handler for settings changes
 * @property onRequestFullscreen - Handler for fullscreen requests
 * @property onSetScale - Handler for display scale changes
 * @property isRunning - Current emulation state
 * @property onToggleRun - Handler for start/pause toggle
 * @property onKillEmulation - Handler for stopping emulation
 * @property onDebugErrors - Handler for debug errors
 */
interface MainMenuProps {
  onLoadROM: (e: React.ChangeEvent<HTMLInputElement>) => void;
  settings: EmulatorSettings;
  onSettingChange: (key: keyof EmulatorSettings, value: boolean) => void;
  onRequestFullscreen: () => void;
  onSetScale: (scale: number) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onKillEmulation: () => void;
  onDebugErrors: (errors: string[]) => void; // Add this prop
}

/**
 * MainMenu Component
 * Provides the main interface for emulator control and settings management.
 * Features:
 * - ROM loading
 * - Emulation control (start/pause/kill)
 * - Settings management (grouped by category)
 * - Display scale control
 */
const MainMenu: React.FC<MainMenuProps> = ({
  onLoadROM,
  settings,
  onSettingChange,
  onRequestFullscreen,
  onSetScale,
  isRunning,
  onToggleRun,
  onKillEmulation,
  onDebugErrors,
}) => {
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const romData = new Uint8Array(arrayBuffer);

    // Log ROM information and get any errors
    const { errors } = GBDebugger.getInstance().logROMInfo(romData);

    // Pass errors to parent component
    onDebugErrors(errors);

    // Call the provided onLoadROM handler
    onLoadROM(event);
  };
  // State for settings panel visibility
  const [showSettings, setShowSettings] = useState(false);

  // Shared CSS classes for consistent styling
  const buttonClasses =
    "px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded border-l-2 border-red-500 transition-all duration-300 text-sm font-medium hover:translate-x-1";
  const menuItemClasses =
    "px-4 py-2 text-white/90 hover:text-white hover:bg-black/60 transition-all duration-200 cursor-pointer flex items-center space-x-2";

  // Settings configuration grouped by category
  const settingsConfig = [
    {
      category: "EMULATION",
      settings: [
        { key: "gbModeOverGbc", label: "GB mode has priority over GBC mode" },
        { key: "useBiosRom", label: "Use the BIOS ROM" },
        {
          key: "overrideCartridgeType",
          label: "Override ROM only cartridge typing to MBC1",
        },
        {
          key: "allowMbcBankAccess",
          label: "Always allow reading and writing to the MBC banks",
        },
      ],
    },
    {
      category: "DISPLAY",
      settings: [
        {
          key: "colorizeGameboyPalettes",
          label: "Colorize Classic GameBoy Palettes",
        },
        { key: "minimalFullscreen", label: "Minimal view on fullscreen" },
        {
          key: "resizeCanvasDirectly",
          label: "Resize canvas directly in JavaScript",
        },
        { key: "smoothResizing", label: "Smooth upon resizing canvas" },
      ],
    },
    {
      category: "AUDIO",
      settings: [
        { key: "enableChannel1", label: "Enable Channel 1 Audio" },
        { key: "enableChannel2", label: "Enable Channel 2 Audio" },
        { key: "enableChannel3", label: "Enable Channel 3 Audio" },
        { key: "enableChannel4", label: "Enable Channel 4 Audio" },
      ],
    },
    {
      category: "ADVANCED",
      settings: [
        {
          key: "disallowTypedArrays",
          label: "Disallow typed arrays to be used",
        },
        { key: "useDmgBootRom", label: "Use the DMG boot ROM instead of CGB" },
      ],
    },
  ];

  return (
    <div className="w-full bg-black/80 backdrop-blur-sm border-b border-red-500/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Left side controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onKillEmulation}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded text-sm font-bold transition-all duration-300 hover:scale-105 border border-red-400/50"
          >
            KILL EMULATOR
          </button>

          <button
            onClick={onToggleRun}
            className={`px-4 py-2 ${
              isRunning
                ? "bg-red-500/80 hover:bg-red-600 border-red-400/50"
                : "bg-cyan-600/80 hover:bg-cyan-700 border-cyan-400/50"
            } text-white rounded text-sm font-bold transition-all duration-300 hover:scale-105 border`}
          >
            {isRunning ? "PAUSE" : "START"}
          </button>

          <label className={buttonClasses}>
            LOAD ROM
            <input
              type="file"
              onChange={onLoadROM}
              accept=".gb,.gbc"
              className="hidden"
            />
          </label>
        </div>

        {/* Right side controls */}
        <div className="relative group">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`${buttonClasses} flex items-center space-x-2`}
          >
            <span>SETTINGS</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                showSettings ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showSettings && (
            <div
              className="fixed mt-2 w-96 bg-black/95 border border-red-500/20 rounded-lg z-40 flex flex-col"
              style={{
                top: "4rem",
                right: "1rem",
                maxHeight: "calc(100vh - 6rem)",
              }}
            >
              <div className="overflow-y-auto custom-scrollbar">
                {settingsConfig.map((category) => (
                  <div
                    key={category.category}
                    className="p-2 border-b border-red-500/20 last:border-b-0"
                  >
                    <div className="text-cyan-400 text-xs font-bold px-4 py-2">
                      {category.category}
                    </div>
                    {category.settings.map(({ key, label }) => (
                      <div key={key} className={menuItemClasses}>
                        <input
                          type="checkbox"
                          checked={settings[key as keyof EmulatorSettings]}
                          onChange={(e) =>
                            onSettingChange(
                              key as keyof EmulatorSettings,
                              e.target.checked
                            )
                          }
                          className="form-checkbox h-4 w-4 text-cyan-500 rounded border-cyan-500/50 bg-black/50 focus:ring-cyan-500"
                        />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Scale Settings */}
                <div className="p-2 border-t border-red-500/20">
                  <div className="text-cyan-400 text-xs font-bold px-4 py-2">
                    SCALE
                  </div>
                  {[1, 2, 3, 4].map((scale) => (
                    <div
                      key={scale}
                      className={`${menuItemClasses} hover:text-cyan-400`}
                      onClick={() => {
                        onSetScale(scale);
                        setShowSettings(false); // Close menu after selection
                      }}
                    >
                      {scale}x
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
