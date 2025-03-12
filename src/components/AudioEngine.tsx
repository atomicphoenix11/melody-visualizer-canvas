
import { useEffect, useRef, useState } from 'react';

interface AudioEngineProps {
  onAudioProcess: (analyserData: Uint8Array) => void;
}

// Define the note frequencies for A through L (follows a musical scale)
const NOTES = {
  'a': 261.63, // C4 (middle C)
  's': 293.66, // D4
  'd': 329.63, // E4
  'f': 349.23, // F4
  'g': 392.00, // G4
  'h': 440.00, // A4
  'j': 493.88, // B4
  'k': 523.25, // C5
  'l': 587.33, // D5
};

const AudioEngine: React.FC<AudioEngineProps> = ({ onAudioProcess }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());
  const gainsRef = useRef<Map<string, GainNode>>(new Map());
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const frameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    const initAudio = () => {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      analyserRef.current.connect(audioContextRef.current.destination);
    };

    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      if (!audioContextRef.current) {
        initAudio();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Set up animation loop for audio data
  useEffect(() => {
    const updateAnalyser = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        onAudioProcess(dataArrayRef.current);
      }
      frameRef.current = requestAnimationFrame(updateAnalyser);
    };

    if (audioContextRef.current) {
      frameRef.current = requestAnimationFrame(updateAnalyser);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [onAudioProcess]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Skip if key is already pressed or not in our note map
      if (activeKeys.has(key) || !NOTES[key as keyof typeof NOTES]) {
        return;
      }

      if (audioContextRef.current && analyserRef.current) {
        // Resume audio context if it's suspended (autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }

        // Create oscillator
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(
          NOTES[key as keyof typeof NOTES], 
          audioContextRef.current.currentTime
        );
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(analyserRef.current);
        
        // Start the sound
        oscillator.start();
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.1);
        
        // Store references
        oscillatorsRef.current.set(key, oscillator);
        gainsRef.current.set(key, gainNode);
        
        // Update active keys
        setActiveKeys(new Set([...activeKeys, key]));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (!NOTES[key as keyof typeof NOTES]) {
        return;
      }
      
      // Release the note
      if (audioContextRef.current && oscillatorsRef.current.has(key)) {
        const gainNode = gainsRef.current.get(key);
        
        if (gainNode) {
          // Create a fade-out effect
          gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.1);
          
          // Stop and clean up after fade-out
          setTimeout(() => {
            oscillatorsRef.current.get(key)?.stop();
            oscillatorsRef.current.delete(key);
            gainsRef.current.delete(key);
            
            // Update active keys
            setActiveKeys(prev => {
              const newSet = new Set(prev);
              newSet.delete(key);
              return newSet;
            });
          }, 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys]);

  // Render a virtual keyboard
  return (
    <div className="fixed bottom-8 left-0 w-full flex items-center justify-center">
      <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl flex">
        {Object.entries(NOTES).map(([key, _]) => (
          <div 
            key={key}
            className={`key ${activeKeys.has(key) ? 'active' : ''}`}
            onMouseDown={() => {
              const keyEvent = new KeyboardEvent('keydown', { key });
              window.dispatchEvent(keyEvent);
            }}
            onMouseUp={() => {
              const keyEvent = new KeyboardEvent('keyup', { key });
              window.dispatchEvent(keyEvent);
            }}
            onMouseLeave={() => {
              if (activeKeys.has(key)) {
                const keyEvent = new KeyboardEvent('keyup', { key });
                window.dispatchEvent(keyEvent);
              }
            }}
          >
            <span className="key-hint">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioEngine;
