
import React from 'react';

const Title: React.FC = () => {
  return (
    <div className="fixed top-4 left-4 z-10">
      <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-visualizer-primary to-visualizer-accent1 bg-clip-text text-transparent">
          Musical Canvas
        </h1>
        <p className="text-sm text-gray-300 mt-1">
          Press keys A-L to play notes
        </p>
      </div>
    </div>
  );
};

export default Title;
