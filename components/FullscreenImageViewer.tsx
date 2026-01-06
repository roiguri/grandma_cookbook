import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import ImageViewer from './ImageViewer';

interface FullscreenImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({ images, initialIndex, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Lock body scroll
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-slate-800/50 text-white/70 rounded-full hover:bg-slate-700 hover:text-white transition-all z-20 backdrop-blur-sm shadow-lg"
            >
              <ChevronRight size={32} />
            </button>
            <button
              onClick={nextImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-slate-800/50 text-white/70 rounded-full hover:bg-slate-700 hover:text-white transition-all z-20 backdrop-blur-sm shadow-lg"
            >
              <ChevronLeft size={32} />
            </button>
          </>
        )}

        <ImageViewer
          src={images[activeIndex]}
          className="bg-transparent"
        />
      </div>
    </div>
  );
};

export default FullscreenImageViewer;

