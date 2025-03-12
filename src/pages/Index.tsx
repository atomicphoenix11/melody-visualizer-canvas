
import { useState, useCallback, useEffect } from 'react';
import AudioEngine from '@/components/AudioEngine';
import Visualizer from '@/components/Visualizer';
import Controls from '@/components/Controls';
import Title from '@/components/Title';

const Index = () => {
  const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null);
  const [activeVisualizer, setActiveVisualizer] = useState<string>('bars');

  // Callback to receive audio data from the AudioEngine
  const handleAudioProcess = useCallback((data: Uint8Array) => {
    setAnalyserData(data.slice()); // Create a copy of the data to ensure reactivity
  }, []);

  const handleChangeVisualizer = useCallback((visualizer: string) => {
    console.log("Changing visualizer to:", visualizer);
    setActiveVisualizer(visualizer);
  }, []);

  // Debug effect to confirm data is being received
  useEffect(() => {
    if (analyserData) {
      console.log("Received audio data, length:", analyserData.length);
    }
  }, [analyserData]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Canvas Visualizer */}
      <Visualizer analyserData={analyserData} activeVisualizer={activeVisualizer} />
      
      {/* Controls and UI */}
      <div className="relative z-20">
        <Title />
        <Controls 
          onChangeVisualizer={handleChangeVisualizer} 
          activeVisualizer={activeVisualizer} 
        />
      </div>
      
      {/* Audio Engine and Virtual Keyboard */}
      <AudioEngine onAudioProcess={handleAudioProcess} />
    </div>
  );
};

export default Index;
