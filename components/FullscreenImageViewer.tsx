import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface FullscreenImageViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({ images, initialIndex, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Reset state when identifying that the active image has changed
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [activeIndex]);

  // Lock body scroll and handle wheel event non-passively
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.deltaY < 0) {
        setZoom(prev => Math.min(3, prev + 0.1));
      } else {
        setZoom(prev => Math.max(1, prev - 0.1));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      document.body.style.overflow = 'unset';
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && zoom > 1 && containerRef.current && imgRef.current) {
      e.preventDefault();
      const rawX = e.clientX - dragStart.current.x;
      const rawY = e.clientY - dragStart.current.y;

      // Calculate boundaries
      const viewportW = containerRef.current.clientWidth;
      const viewportH = containerRef.current.clientHeight;

      let imgW = imgRef.current.clientWidth;
      let imgH = imgRef.current.clientHeight;

      // If rotated 90 or 270 degrees, swap dimensions for calculation
      if (rotation % 180 !== 0) {
        [imgW, imgH] = [imgH, imgW];
      }

      const maxPanX = Math.max(0, (imgW * zoom - viewportW) / 2);
      const maxPanY = Math.max(0, (imgH * zoom - viewportH) / 2);

      const clampedX = Math.min(Math.max(rawX, -maxPanX), maxPanX);
      const clampedY = Math.min(Math.max(rawY, -maxPanY), maxPanY);

      setPan({ x: clampedX, y: clampedY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

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
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300 touch-none"
      onClick={onClose}
    >
      <button className="absolute top-8 right-8 text-white/60 p-4 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-[2rem] active:scale-90 z-50">
        <X size={32} />
      </button>

      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
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

        <img
          ref={imgRef}
          src={images[activeIndex]}
          className={`object-contain transition-transform duration-75 ease-out ${isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : ''
            } ${rotation % 180 !== 0
              ? 'max-w-[100vh] max-h-[100vw]'
              : 'max-w-full max-h-full'
            }`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            touchAction: 'none'
          }}
          alt=""
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          draggable={false}
        />

        {/* Floating Toolbar */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl p-3 pr-6 rounded-full border border-white/10 shadow-2xl z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-white font-mono font-bold w-12 text-center text-sm">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.5))}
            className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <div className="w-px h-6 bg-white/20 mx-2"></div>
          <button
            onClick={() => setRotation(prev => prev + 90)}
            className="p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Rotate"
          >
            <RotateCw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenImageViewer;
