
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Waveform, Circle, Sparkles } from 'lucide-react';

interface ControlsProps {
  onChangeVisualizer: (visualizer: string) => void;
  activeVisualizer: string;
}

const Controls: React.FC<ControlsProps> = ({ onChangeVisualizer, activeVisualizer }) => {
  const [isOpen, setIsOpen] = useState(true);

  const visualizers = [
    { id: 'bars', name: 'Bars', icon: <Waveform size={18} /> },
    { id: 'circular', name: 'Circular', icon: <Circle size={18} /> },
    { id: 'wave', name: 'Wave', icon: <Music size={18} /> },
    { id: 'particles', name: 'Particles', icon: <Sparkles size={18} /> },
  ];

  return (
    <div className="fixed top-4 right-4 z-10">
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl mb-4">
          <div className="flex flex-col space-y-2">
            {visualizers.map((visualizer) => (
              <Button
                key={visualizer.id}
                variant={activeVisualizer === visualizer.id ? 'default' : 'outline'}
                className={`flex items-center justify-start gap-2 ${
                  activeVisualizer === visualizer.id 
                    ? 'bg-visualizer-primary hover:bg-visualizer-secondary' 
                    : 'bg-black/40 hover:bg-black/60 text-white'
                }`}
                onClick={() => onChangeVisualizer(visualizer.id)}
              >
                {visualizer.icon}
                {visualizer.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '×' : '≡'}
      </Button>
    </div>
  );
};

export default Controls;
