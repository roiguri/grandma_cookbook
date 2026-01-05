import React, { useRef, useState } from 'react';
import { Cropper, CropperRef } from 'react-advanced-cropper';
import { Check, X, RotateCw } from 'lucide-react';
import 'react-advanced-cropper/dist/style.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const cropperRef = useRef<CropperRef>(null);

  const handleRotate = () => {
    if (cropperRef.current) {
      cropperRef.current.rotateImage(90);
      cropperRef.current.setCoordinates((state) => {
        const { imageSize } = state;
        return {
          width: imageSize.width,
          height: imageSize.height,
          left: 0,
          top: 0
        };
      });
    }
  };

  const handleSave = () => {
    if (cropperRef.current) {
      const canvas = cropperRef.current.getCanvas();
      if (canvas) {
        // High quality logic
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        onCropComplete(croppedImage);
      } else {
        // Fallback if canvas is not ready (unlikely on user click)
        onCropComplete(imageSrc);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      <div className="relative flex-grow w-full bg-black overflow-hidden flex items-center justify-center">
        <Cropper
          ref={cropperRef}
          src={imageSrc}
          className={'h-full w-full object-contain'}
          stencilProps={{
            resizable: true,
            movable: true,
            previewClassName: "border-2 border-white",
            lines: true,
            handlers: true
          }}
          defaultSize={({ imageSize }) => imageSize}
          imageRestriction="fitArea" // Fit image to container, prevents zooming out smaller than container
        />
      </div>

      <div className="bg-slate-900 p-6 pb-12 rounded-t-[2rem] flex items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10">
        <button
          onClick={onCancel}
          className="flex-shrink-0 bg-slate-800 text-slate-300 p-4 sm:p-5 rounded-3xl font-bold hover:text-white hover:bg-slate-700 transition-all active:scale-95"
          title="בטל"
        >
          <X size={24} className="sm:w-7 sm:h-7" />
        </button>

        <button
          onClick={handleRotate}
          className="flex-shrink-0 bg-slate-800 text-slate-300 p-4 sm:p-5 rounded-3xl font-bold hover:text-white hover:bg-slate-700 transition-all active:scale-95"
          title="סובב ב-90 מעלות"
        >
          <RotateCw size={24} className="sm:w-7 sm:h-7" />
        </button>

        <button
          onClick={handleSave}
          className="flex-grow bg-orange-600 text-white py-4 sm:py-5 px-6 sm:px-8 rounded-3xl font-black text-lg sm:text-xl shadow-xl shadow-orange-900/50 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95"
        >
          <Check size={24} className="sm:w-7 sm:h-7" />
          <span>שמור וחתוך</span>
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;
