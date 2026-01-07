import React from 'react';
import { X } from 'lucide-react';
import ImageViewer from './ImageViewer';

interface FullscreenImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({ images, initialIndex, onClose }) => {
  // Lock body scroll
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);


  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button className="absolute top-8 right-8 text-white/60 p-4 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-[2rem] active:scale-90 z-50">
        <X size={32} />
      </button>

      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content area (though ImageViewer also stops propagation often)
      >
        <ImageViewer
          images={images}
          initialIndex={initialIndex}
          className="bg-transparent"
        />
      </div>
    </div>
  );
};

export default FullscreenImageViewer;

