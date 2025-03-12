
import { useState, useCallback } from 'react';
import AudioEngine from '@/components/AudioEngine';
import Visualizer from '@/components/Visualizer';
import Controls from '@/components/Controls';
import Title from '@/components/Title';

const Index = () => {
  const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null);
  const [activeVisualizer, setActiveVisualizer] = useState<string>('bars');

  const handleAudioProcess = useCallback((data: Uint8Array) => {
    setAnalyserData(new Uint8Array(data));
  }, []);

  const handleChangeVisualizer = useCallback((visualizer: string) => {
    setActiveVisualizer(visualizer);
  }, []);

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
