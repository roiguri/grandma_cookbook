import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Redo2 } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  className?: string; // For customized sizing/positioning from parent
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt = '', className = '' }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null); // To store current state before switch

  // Store view state for each image: { [src]: { zoom, rotation, pan } }
  const viewStates = useRef<Record<string, { zoom: number, rotation: number, pan: { x: number, y: number } }>>({});
  const prevSrc = useRef<string>(src);

  // Ref to hold the *current* state values, updated on every render
  const currentState = useRef({ zoom: 1, rotation: 0, pan: { x: 0, y: 0 } });

  // Sync state to ref
  useEffect(() => {
    currentState.current = { zoom, rotation, pan };
  }, [zoom, rotation, pan]);

  // Overwrite the logic to use the ref for saving
  useEffect(() => {
    // When src changes:
    // 1. Save PREVIOUS image state
    // Only save if prevSrc.current is valid (not the initial empty string or first render)
    if (prevSrc.current) {
      viewStates.current[prevSrc.current] = currentState.current;
    }

    // 2. Load NEW image state
    const savedState = viewStates.current[src];
    if (savedState) {
      setZoom(savedState.zoom);
      setRotation(savedState.rotation);
      setPan(savedState.pan);
      // Update current ref immediately so we don't overwrite with old values if a render happens
      currentState.current = savedState;
    } else {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      currentState.current = { zoom: 1, rotation: 0, pan: { x: 0, y: 0 } };
    }

    prevSrc.current = src;
  }, [src]);

  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Handle wheel for zooming
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Only capture wheel if we are hovering this component
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

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    // Clear saved state for this image so it resets permanently if we navigate away and back
    delete viewStates.current[src];
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden touch-none bg-slate-100 ${className}`}
    >
      <img
        ref={imgRef}
        src={src}
        className={`object-contain transition-transform duration-75 ease-out ${isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : ''
          } ${rotation % 180 !== 0
            ? 'max-w-[80vh] max-h-[80vw]' // Adjusted for potentially smaller containers than full screen? Or keep similar logic? 
            // Actually, in specific containers, 100% of container is better.
            : 'max-w-full max-h-full'
          }`}
        style={{
          // When rotated, we need to ensure it fits. 
          // In a flex container max-w-full usually works relative to parent.
          // But rotation swaps axis so we might need logic.
          // For now keeping simpler logic:
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          touchAction: 'none'
        }}
        alt={alt}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        draggable={false}
      />

      {/* Floating Toolbar */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl p-2 pr-4 rounded-full border border-white/10 shadow-2xl z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleReset}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Reset View"
        >
          <Redo2 size={18} />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1"></div>

        <button
          onClick={() => setZoom(Math.max(1, zoom - 0.5))}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-white font-mono font-bold w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.5))}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1"></div>
        <button
          onClick={() => setRotation(prev => prev + 90)}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Rotate"
        >
          <RotateCw size={18} />
        </button>
      </div>
    </div>
  );
};

export default ImageViewer;
