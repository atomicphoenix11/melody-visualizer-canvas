import { useCallback, useEffect, useRef, useState } from 'react';

interface VisualizerProps {
  analyserData: Uint8Array | null;
  activeVisualizer: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyserData, activeVisualizer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const particlesRef = useRef<any[]>([]);
  const colorIndex = useRef(0);
  const initializedRef = useRef(false);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set up particles for particle visualizer
  useEffect(() => {
    if (activeVisualizer === 'particles') {
      particlesRef.current = Array.from({ length: 100 }, () => ({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 5 + 2,
        speedX: Math.random() * 2 - 1,
        speedY: Math.random() * 2 - 1,
        color: `hsl(${Math.random() * 60 + 250}, 100%, 70%)`,
      }));
    }
  }, [activeVisualizer, dimensions]);

  // Initialize the canvas with some default visuals
  useEffect(() => {
    if (!initializedRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Draw initial state with default values
        const defaultData = new Uint8Array(128);
        for (let i = 0; i < defaultData.length; i++) {
          defaultData[i] = Math.random() * 50; // Some random initial values
        }
        
        // Clear canvas with dark background
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        
        // Draw a starter visualization
        drawBars(ctx, defaultData);
        initializedRef.current = true;
      }
    }
  }, [dimensions]);

  // Color palette for visualizers
  const getColor = useCallback((index: number, total: number) => {
    // Cycle through colors based on the visualizer type
    const colorSchemes = {
      bars: [
        '#9b87f5', '#7E69AB', '#6E59A5', '#D6BCFA', 
        '#D946EF', '#F97316', '#0EA5E9'
      ],
      circular: [
        '#D946EF', '#9b87f5', '#0EA5E9', '#F97316', 
        '#7E69AB', '#D6BCFA', '#6E59A5'
      ],
      wave: [
        '#0EA5E9', '#9b87f5', '#D946EF', '#7E69AB', 
        '#F97316', '#D6BCFA', '#6E59A5'
      ],
      particles: [
        '#D6BCFA', '#9b87f5', '#D946EF', '#0EA5E9', 
        '#F97316', '#7E69AB', '#6E59A5'
      ]
    };

    const colors = colorSchemes[activeVisualizer as keyof typeof colorSchemes] || colorSchemes.bars;
    
    // Get a color based on the position in the dataset
    const colorPosition = Math.floor((index / total) * colors.length);
    return colors[colorPosition % colors.length];
  }, [activeVisualizer]);

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with a solid black background first
    ctx.fillStyle = 'rgb(0, 0, 0)';  
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Then add semi-transparent layer for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    console.log("Drawing visualizer:", activeVisualizer, "Data length:", analyserData.length);

    // Determine which visualization to render
    switch (activeVisualizer) {
      case 'bars':
        drawBars(ctx, analyserData);
        break;
      case 'circular':
        drawCircular(ctx, analyserData);
        break;
      case 'wave':
        drawWave(ctx, analyserData);
        break;
      case 'particles':
        drawParticles(ctx, analyserData);
        break;
      default:
        drawBars(ctx, analyserData);
    }
  }, [analyserData, dimensions, activeVisualizer, getColor]);

  // Visualizer 1: Frequency bars
  const drawBars = useCallback((ctx: CanvasRenderingContext2D, data: Uint8Array) => {
    const { width, height } = dimensions;
    const barWidth = width / data.length;
    
    colorIndex.current = (colorIndex.current + 0.1) % 360;
    
    for (let i = 0; i < data.length; i++) {
      // Amplify the data values for more visible effect
      const amplifiedValue = Math.min(255, data[i] * 2.5);  // Further amplified for better visibility
      const barHeight = (amplifiedValue / 255) * height * 0.8;
      
      // Calculate bar positions for a centered look
      const x = i * barWidth + width / 2 - (data.length * barWidth) / 2;
      const y = height - barHeight;
      
      // Create gradient fill
      const gradient = ctx.createLinearGradient(x, y, x, height);
      gradient.addColorStop(0, getColor(i, data.length));
      gradient.addColorStop(1, 'rgba(26, 31, 44, 0.5)');
      
      ctx.fillStyle = gradient;
      
      // Draw with rounded corners
      const radius = barWidth * 0.5 > 10 ? 10 : barWidth * 0.5;
      roundedRect(ctx, x, y, barWidth - 1, barHeight, radius);
      ctx.fill();
    }
  }, [dimensions, getColor]);

  // Visualizer 2: Circular
  const drawCircular = useCallback((ctx: CanvasRenderingContext2D, data: Uint8Array) => {
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;
    
    // Draw circular visualization
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    for (let i = 0; i < data.length; i++) {
      const angle = (i / data.length) * Math.PI * 2;
      // Amplify the data values for more visible effect
      const amplifiedValue = Math.min(255, data[i] * 2.5);  // Further amplified
      const amplitude = (amplifiedValue / 255) * maxRadius;
      
      // Calculate points on circle
      const x1 = centerX + Math.cos(angle) * amplitude;
      const y1 = centerY + Math.sin(angle) * amplitude;
      
      // Draw lines
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = getColor(i, data.length);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw circles at the endpoints
      ctx.beginPath();
      const circleSize = Math.max(2, (amplifiedValue / 255) * 8);
      ctx.arc(x1, y1, circleSize, 0, Math.PI * 2);
      ctx.fillStyle = getColor(i, data.length);
      ctx.fill();
    }
  }, [dimensions, getColor]);

  // Visualizer 3: Wave
  const drawWave = useCallback((ctx: CanvasRenderingContext2D, data: Uint8Array) => {
    const { width, height } = dimensions;
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    // Create wave path
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * width;
      // Amplify the data values for more visible effect
      const amplifiedValue = Math.min(255, data[i] * 2.5);  // Further amplified
      const y = height / 2 + ((amplifiedValue / 255) * height * 0.4) * Math.sin(i * 0.1 + colorIndex.current);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Complete the path back to the bottom
    ctx.lineTo(width, height / 2);
    
    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(155, 135, 245, 0.7)');
    gradient.addColorStop(1, 'rgba(155, 135, 245, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Stroke
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(214, 188, 250, 0.8)';
    ctx.stroke();
    
    // Increment color index for animation
    colorIndex.current = (colorIndex.current + 0.05) % (Math.PI * 2);
  }, [dimensions, getColor]);

  // Visualizer 4: Particles
  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, data: Uint8Array) => {
    const { width, height } = dimensions;
    const averageFrequency = data.reduce((sum, value) => sum + value, 0) / data.length;
    const intensity = Math.min(1, averageFrequency / 255 * 3);  // Amplify intensity
    
    // Update and draw particles
    for (let i = 0; i < particlesRef.current.length; i++) {
      const particle = particlesRef.current[i];
      
      // Update position with audio reactivity
      particle.x += particle.speedX * (1 + intensity * 5);  // Further increased reactivity
      particle.y += particle.speedY * (1 + intensity * 5);  // Further increased reactivity
      
      // Wrap around edges
      if (particle.x > width) particle.x = 0;
      if (particle.x < 0) particle.x = width;
      if (particle.y > height) particle.y = 0;
      if (particle.y < 0) particle.y = height;
      
      // Draw particle
      ctx.beginPath();
      const size = particle.size * (1 + intensity * 3);  // Increased size reactivity
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = 0.7 + intensity * 0.3;
      ctx.fill();
      
      // Connect particles that are close to each other
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const particle2 = particlesRef.current[j];
        const dx = particle.x - particle2.x;
        const dy = particle.y - particle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100 * (1 + intensity)) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle2.x, particle2.y);
          ctx.strokeStyle = particle.color;
          ctx.globalAlpha = (1 - distance / (100 * (1 + intensity))) * 0.5;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    
    ctx.globalAlpha = 1;
  }, [dimensions]);

  // Helper function for drawing rounded rectangles
  const roundedRect = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);

  // Ensure canvas has proper stacking order and is visible
  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute top-0 left-0 z-10 pointer-events-none"
    />
  );
};

export default Visualizer;
