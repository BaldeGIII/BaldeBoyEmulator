import { useEffect, useRef, useState, memo } from "react";
import type { EmulatorType } from "../core/emulator";

interface AudioProps {
  emulator: EmulatorType | null;
  isKilled: boolean;
}

const Audio = memo<AudioProps>(({ emulator, isKilled }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    if (!emulator || isKilled) {
      // Cleanup audio resources
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsAudioInitialized(false);
      return;
    }

    const initAudio = async () => {
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext({
          sampleRate: 48000,
          latencyHint: "interactive",
        });
        audioContextRef.current = ctx;

        // Audio processing chain
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.7;

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        const bufferSize = 4096;
        const processor = ctx.createScriptProcessor(bufferSize, 0, 2);

        processor.onaudioprocess = (e) => {
          if (!emulator) return;

          const leftChannel = e.outputBuffer.getChannelData(0);
          const rightChannel = e.outputBuffer.getChannelData(1);

          try {
            const samples = emulator.getAudioSamples(bufferSize);
            for (let i = 0; i < bufferSize; i++) {
              if (i * 2 + 1 < samples.length) {
                leftChannel[i] = Math.tanh(samples[i * 2]);
                rightChannel[i] = Math.tanh(samples[i * 2 + 1]);
              } else {
                leftChannel[i] = 0;
                rightChannel[i] = 0;
              }
            }
          } catch (error) {
            console.error("Audio processing error:", error);
            leftChannel.fill(0);
            rightChannel.fill(0);
          }
        };

        processor.connect(compressor);
        compressor.connect(gainNode);
        gainNode.connect(ctx.destination);

        processorRef.current = processor;
        gainNodeRef.current = gainNode;

        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        setIsAudioInitialized(true);
        setAudioError(null);
      } catch (error) {
        console.error("Audio initialization failed:", error);
        setAudioError("Failed to initialize audio. Please refresh the page.");
        if (audioContextRef.current) {
          await audioContextRef.current.close();
          audioContextRef.current = null;
        }
      }
    };

    initAudio();

    return () => {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
    };
  }, [emulator, isKilled]);

  if (audioError) {
    return (
      <div className="text-red-500 text-sm font-['Press_Start_2P']">
        {audioError}
      </div>
    );
  }

  return null;
});

Audio.displayName = "Audio";
export default Audio;