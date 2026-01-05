import React, { useRef } from 'react';
import { Check, X, RotateCw } from 'lucide-react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const cropperRef = useRef<ReactCropperElement>(null);

  const handleSave = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      // Get cropped canvas
      const canvas = cropper.getCroppedCanvas();
      if (canvas) {
        // Convert to base64
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9); // High quality
        onCropComplete(croppedImage);
      }
    } else {
      // Fallback
      onCropComplete(imageSrc);
    }
  };

  const handleRotate = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.rotate(90);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      <div className="relative flex-grow w-full bg-black flex items-center justify-center overflow-hidden">
        <Cropper
          src={imageSrc}
          style={{ height: '100%', width: '100%' }}
          initialAspectRatio={undefined} // Free aspect ratio
          guides={true} // Show grid guides
          viewMode={1} // Restrict crop box to canvas
          dragMode="move" // Move image by default, crop by dragging corners
          rotatable={true}
          ref={cropperRef}
          background={false}
          autoCropArea={1} // Start with 100% of image cropped
          responsive={true}
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
