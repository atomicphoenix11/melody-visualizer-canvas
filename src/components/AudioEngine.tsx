
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

  useEffect(() => {
    const initAudio = () => {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // Set initial values to ensure visualizer has data
      if (dataArrayRef.current) {
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          dataArrayRef.current[i] = Math.random() * 50; // Add some random initial data
        }
        onAudioProcess(dataArrayRef.current);
      }
      
      analyserRef.current.connect(audioContextRef.current.destination);
    };

    initAudio(); // Initialize immediately

    const handleFirstInteraction = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
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
  }, [onAudioProcess]);

  useEffect(() => {
    const updateAnalyser = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Amplify the data to make visualizations more pronounced
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          dataArrayRef.current[i] = Math.min(255, dataArrayRef.current[i] * 1.5);
        }
        
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (activeKeys.has(key) || !NOTES[key as keyof typeof NOTES]) {
        return;
      }

      if (audioContextRef.current && analyserRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }

        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(
          NOTES[key as keyof typeof NOTES], 
          audioContextRef.current.currentTime
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(analyserRef.current);
        
        oscillator.start();
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, audioContextRef.current.currentTime + 0.1);
        
        oscillatorsRef.current.set(key, oscillator);
        gainsRef.current.set(key, gainNode);
        
        setActiveKeys(new Set([...activeKeys, key]));
        
        // Boost the data for visualization when a key is pressed
        if (dataArrayRef.current) {
          const index = Math.floor(NOTES[key as keyof typeof NOTES] % dataArrayRef.current.length);
          for (let i = 0; i < 10; i++) {
            const idx = (index + i) % dataArrayRef.current.length;
            dataArrayRef.current[idx] = 230;
          }
          onAudioProcess(dataArrayRef.current);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (!NOTES[key as keyof typeof NOTES]) {
        return;
      }
      
      if (audioContextRef.current && oscillatorsRef.current.has(key)) {
        const gainNode = gainsRef.current.get(key);
        
        if (gainNode) {
          gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.1);
          
          setTimeout(() => {
            oscillatorsRef.current.get(key)?.stop();
            oscillatorsRef.current.delete(key);
            gainsRef.current.delete(key);
            
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
  }, [activeKeys, onAudioProcess]);

  return (
    <div className="fixed bottom-8 left-0 w-full flex items-center justify-center z-30">
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
