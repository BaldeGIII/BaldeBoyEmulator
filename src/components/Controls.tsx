import React, { useEffect, useState } from "react";
import type { EmulatorType } from "../core/emulator";

// Define the props for Controls
interface ControlsProps {
  emulator: EmulatorType | null;
  isRunning: boolean;
}

/**
 * Controls Component
 * Manages keyboard input for GameBoy controls.
 * Provides a visual reference for control mapping.
 *
 * Key Mappings:
 * - Arrow keys: D-pad
 * - Z: A button
 * - X: B button
 * - Enter: Start
 * - Shift: Select
 */
const Controls: React.FC<ControlsProps> = ({ emulator, isRunning }) => {
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (!emulator || !isRunning) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          emulator.setButtonPressed("up");
          break;
        case "ArrowDown":
          emulator.setButtonPressed("down");
          break;
        case "ArrowLeft":
          emulator.setButtonPressed("left");
          break;
        case "ArrowRight":
          emulator.setButtonPressed("right");
          break;
        case "z":
          emulator.setButtonPressed("a");
          break;
        case "x":
          emulator.setButtonPressed("b");
          break;
        case "Enter":
          emulator.setButtonPressed("start");
          break;
        case "Shift":
          emulator.setButtonPressed("select");
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          emulator.setButtonReleased("up");
          break;
        case "ArrowDown":
          emulator.setButtonReleased("down");
          break;
        case "ArrowLeft":
          emulator.setButtonReleased("left");
          break;
        case "ArrowRight":
          emulator.setButtonReleased("right");
          break;
        case "z":
          emulator.setButtonReleased("a");
          break;
        case "x":
          emulator.setButtonReleased("b");
          break;
        case "Enter":
          emulator.setButtonReleased("start");
          break;
        case "Shift":
          emulator.setButtonReleased("select");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [emulator, isRunning]);

  return (
    <div className="absolute left-8 bottom-8 z-40">
      <button
        onClick={() => setShowControls(!showControls)}
        className="bg-black/80 hover:bg-black text-white px-4 py-2 rounded-lg border-r-2 border-red-500 hover:border-cyan-400 transition-all duration-300 text-sm font-medium hover:-translate-x-1"
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </button>

      {showControls && (
        <div className="absolute left-0 bottom-full mb-2 bg-black/95 backdrop-blur-md rounded-lg p-4 border border-red-500/20 w-64 transform-gpu">
          <h2 className="text-cyan-400 text-lg font-bold mb-2 text-center">
            CONTROLS
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-red-500 font-bold mb-2 text-sm">Movement</h3>
              <ul className="space-y-1 text-xs">
                <li className="text-white/90">
                  <span className="text-cyan-400">↑↓←→</span> Arrow Keys
                </li>
                <li className="text-white/90">
                  <span className="text-cyan-400">Z</span> - A Button
                </li>
                <li className="text-white/90">
                  <span className="text-cyan-400">X</span> - B Button
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-red-500 font-bold mb-2 text-sm">System</h3>
              <ul className="space-y-1 text-xs">
                <li className="text-white/90">
                  <span className="text-cyan-400">Enter</span> - Start
                </li>
                <li className="text-white/90">
                  <span className="text-cyan-400">Shift</span> - Select
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;
