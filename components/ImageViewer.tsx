import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Redo2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface ImageViewerProps {
  src?: string; // Single image mode
  images?: string[]; // Multi-image mode
  initialIndex?: number;
  alt?: string;
  className?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, images, initialIndex = 0, alt = '', className = '' }) => {
  // Determine mode
  const isMultiMode = !!images && images.length > 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Resolve current source
  const currentSrc = isMultiMode ? images![activeIndex] : src || '';

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isToolbarHidden, setIsToolbarHidden] = useState(false);
  const [isTagVisible, setIsTagVisible] = useState(true);
  const tagHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const evCache = useRef<Array<{ pointerId: number; clientX: number; clientY: number }>>([]);
  const prevDiff = useRef<number>(-1);
  const lastTapTime = useRef<number>(0);
  const tapStart = useRef<{ x: number; y: number; valid: boolean }>({ x: 0, y: 0, valid: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Store view state for each image: { [src]: { zoom, rotation, pan } }
  const viewStates = useRef<Record<string, { zoom: number, rotation: number, pan: { x: number, y: number } }>>({});
  const prevSrc = useRef<string>(currentSrc);
  const infoRef = useRef<{ zoom: number, rotation: number, pan: { x: number, y: number } }>({ zoom: 1, rotation: 0, pan: { x: 0, y: 0 } });

  // Sync ref with state
  useEffect(() => {
    infoRef.current = { zoom, rotation, pan };
  }, [zoom, rotation, pan]);

  // Handle navigation reset/restore logic
  useEffect(() => {
    // 1. Save state for PREVIOUS source
    if (prevSrc.current && prevSrc.current !== currentSrc) {
      viewStates.current[prevSrc.current] = infoRef.current;
    }

    // 2. Load state for NEW source
    if (prevSrc.current !== currentSrc) {
      const saved = viewStates.current[currentSrc];
      if (saved) {
        setZoom(saved.zoom);
        setRotation(saved.rotation);
        setPan(saved.pan);
      } else {
        setZoom(1);
        setRotation(0);
        setPan({ x: 0, y: 0 });
      }
    }

    prevSrc.current = currentSrc;
  }, [currentSrc]);

  // Reset index if image list changes entirely
  useEffect(() => {
    if (isMultiMode && images) {
      if (activeIndex >= images.length) {
        setActiveIndex(0);
      }
    }
  }, [images, isMultiMode, activeIndex]);


  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Handle wheel for zooming
  useEffect(() => {
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
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Auto-hide tag logic (hide tag when toolbar is visible after delay)
  const startTagHideTimer = () => {
    setIsTagVisible(true);
    if (tagHideTimeoutRef.current) {
      clearTimeout(tagHideTimeoutRef.current);
    }
    tagHideTimeoutRef.current = setTimeout(() => {
      setIsTagVisible(false);
    }, 2500);
  };

  // Start tag hide timer when toolbar is shown
  useEffect(() => {
    if (!isToolbarHidden) {
      startTagHideTimer();
    } else {
      // When toolbar is hidden, always show the tag
      setIsTagVisible(true);
      if (tagHideTimeoutRef.current) {
        clearTimeout(tagHideTimeoutRef.current);
      }
    }
    return () => {
      if (tagHideTimeoutRef.current) {
        clearTimeout(tagHideTimeoutRef.current);
      }
    };
  }, [isToolbarHidden]);

  // Handle mouse movement - show tag temporarily when toolbar is visible
  const handleMouseMove = () => {
    if (!isToolbarHidden) {
      startTagHideTimer();
    }
  };

  // Handle touch - show tag temporarily when toolbar is visible  
  const handleTouchStart = () => {
    if (!isToolbarHidden) {
      startTagHideTimer();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Add to cache
    evCache.current.push({ pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY });

    // Always capture pointer for multi-touch support
    e.currentTarget.setPointerCapture(e.pointerId);

    // Tap detection setup
    if (evCache.current.length === 1) {
      tapStart.current = { x: e.clientX, y: e.clientY, valid: true };
    } else {
      tapStart.current.valid = false; // Multi-touch cancels tap
    }

    if (evCache.current.length === 2) {
      // Start pinch
      const dx = evCache.current[0].clientX - evCache.current[1].clientX;
      const dy = evCache.current[0].clientY - evCache.current[1].clientY;
      prevDiff.current = Math.hypot(dx, dy);
      setIsDragging(false); // Stop dragging when pinching starts
    } else if (evCache.current.length === 1 && zoom > 1) {
      // Start drag
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Update event in cache
    const index = evCache.current.findIndex(cachedEv => cachedEv.pointerId === e.pointerId);
    if (index > -1) {
      evCache.current[index] = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY };
    }

    // Tap validation
    if (tapStart.current.valid) {
      const dist = Math.hypot(e.clientX - tapStart.current.x, e.clientY - tapStart.current.y);
      if (dist > 10) {
        tapStart.current.valid = false;
      }
    }

    if (evCache.current.length === 2 && containerRef.current && imgRef.current) {
      // Handle Pinch
      e.preventDefault();
      const dx = evCache.current[0].clientX - evCache.current[1].clientX;
      const dy = evCache.current[0].clientY - evCache.current[1].clientY;
      const curDiff = Math.hypot(dx, dy);

      if (prevDiff.current > 0) {
        const delta = curDiff - prevDiff.current;
        if (Math.abs(delta) > 0) {
          setZoom(prev => {
            const newZoom = Math.min(3, Math.max(1, prev + delta * 0.01));

            // Clamp pan to keep image in bounds with new zoom
            const viewportW = containerRef.current!.clientWidth;
            const viewportH = containerRef.current!.clientHeight;
            let imgW = imgRef.current!.clientWidth;
            let imgH = imgRef.current!.clientHeight;

            if (rotation % 180 !== 0) {
              [imgW, imgH] = [imgH, imgW];
            }

            const maxPanX = Math.max(0, (imgW * newZoom - viewportW) / 2);
            const maxPanY = Math.max(0, (imgH * newZoom - viewportH) / 2);

            setPan(prevPan => ({
              x: Math.min(Math.max(prevPan.x, -maxPanX), maxPanX),
              y: Math.min(Math.max(prevPan.y, -maxPanY), maxPanY)
            }));

            return newZoom;
          });
        }
      }
      prevDiff.current = curDiff;
    } else if (isDragging && zoom > 1 && containerRef.current && imgRef.current) {
      e.preventDefault();
      const rawX = e.clientX - dragStart.current.x;
      const rawY = e.clientY - dragStart.current.y;

      const viewportW = containerRef.current.clientWidth;
      const viewportH = containerRef.current.clientHeight;

      let imgW = imgRef.current.clientWidth;
      let imgH = imgRef.current.clientHeight;

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
    const index = evCache.current.findIndex(cachedEv => cachedEv.pointerId === e.pointerId);
    if (index > -1) {
      evCache.current.splice(index, 1);
    }

    e.currentTarget.releasePointerCapture(e.pointerId);

    if (evCache.current.length < 2) {
      prevDiff.current = -1;
    }

    if (evCache.current.length === 0) {
      setIsDragging(false);

      // Handle Double Tap
      if (tapStart.current.valid && containerRef.current && imgRef.current) {
        const now = Date.now();
        if (now - lastTapTime.current < 300) {
          // Double Tap Detected
          e.preventDefault();
          e.stopPropagation();

          // Zoom in by 0.5x, up to max 3x. No zoom out on double tap.
          const newZoom = Math.min(3, zoom + 0.5);

          if (newZoom !== zoom) {
            const rect = containerRef.current.getBoundingClientRect();

            // Tap position relative to container center
            const cx = e.clientX - rect.left - rect.width / 2;
            const cy = e.clientY - rect.top - rect.height / 2;

            // Calculate new pan to keep tap point stationary
            // P_screen = P_world * zoom + pan
            // P_world = (P_screen - pan) / zoom
            // newPan = P_screen - P_world * newZoom
            const newPanX = cx - (cx - pan.x) / zoom * newZoom;
            const newPanY = cy - (cy - pan.y) / zoom * newZoom;

            // Clamp
            const viewportW = containerRef.current.clientWidth;
            const viewportH = containerRef.current.clientHeight;
            let imgW = imgRef.current.clientWidth;
            let imgH = imgRef.current.clientHeight;

            if (rotation % 180 !== 0) {
              [imgW, imgH] = [imgH, imgW];
            }

            const maxPanX = Math.max(0, (imgW * newZoom - viewportW) / 2);
            const maxPanY = Math.max(0, (imgH * newZoom - viewportH) / 2);

            const clampedX = Math.min(Math.max(newPanX, -maxPanX), maxPanX);
            const clampedY = Math.min(Math.max(newPanY, -maxPanY), maxPanY);

            setZoom(newZoom);
            setPan({ x: clampedX, y: clampedY });
          }
          lastTapTime.current = 0; // Reset
        } else {
          lastTapTime.current = now;
        }
      }
    } else if (evCache.current.length === 1 && zoom > 1) {
      // Resume dragging with the remaining finger
      const remaining = evCache.current[0];
      dragStart.current = { x: remaining.clientX - pan.x, y: remaining.clientY - pan.y };
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    delete viewStates.current[currentSrc];
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMultiMode || !images) return;
    setActiveIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMultiMode || !images) return;
    setActiveIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };


  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden touch-none bg-slate-100 ${className}`}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
    >
      {currentSrc ? (
        <img
          ref={imgRef}
          src={currentSrc}
          className={`object-contain transition-transform duration-75 ease-out ${isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : ''
            } ${rotation % 180 !== 0
              ? 'max-w-[80vh] max-h-[80vw]'
              : 'max-w-full max-h-full'
            }`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            touchAction: 'none'
          }}
          alt={alt}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          draggable={false}
        />
      ) : (
        <div className="text-slate-400">No Image</div>
      )}

      {/* Navigation Arrows (Multi Mode Only) */}
      {isMultiMode && images!.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/40 text-white/70 rounded-full hover:bg-slate-900/60 hover:text-white transition-all backdrop-blur-sm z-20"
          >
            <ChevronRight size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/40 text-white/70 rounded-full hover:bg-slate-900/60 hover:text-white transition-all backdrop-blur-sm z-20"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Pagination Dots */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-slate-900/50 backdrop-blur-md rounded-full z-20 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {images!.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${idx === activeIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Toggle Tag (Show/Hide) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsToolbarHidden(!isToolbarHidden);
        }}
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/80 backdrop-blur-xl px-4 py-1 rounded-full border border-white/10 shadow-lg text-white/70 hover:text-white transition-all flex items-center gap-1 text-xs font-bold ${isToolbarHidden
          ? 'opacity-100'
          : isTagVisible
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
          }`}
      >
        {isToolbarHidden ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {isToolbarHidden ? 'הצג' : 'הסתר'}
      </button>

      {/* Floating Toolbar */}
      <div
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${isToolbarHidden ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => {
          // Show tag while hovering over toolbar
          if (tagHideTimeoutRef.current) clearTimeout(tagHideTimeoutRef.current);
          setIsTagVisible(true);
        }}
        onMouseLeave={() => {
          // Restart tag hide timer when leaving toolbar
          startTagHideTimer();
        }}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-2xl">
          <button
            onClick={handleReset}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Reset View"
          >
            <Redo2 size={16} />
          </button>
          <div className="w-px h-4 bg-white/20"></div>

          <button
            onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-white font-mono font-bold w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.5))}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-white/20"></div>
          <button
            onClick={() => setRotation(prev => prev + 90)}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Rotate"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
