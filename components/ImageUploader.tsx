import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon, X, Plus, Play } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface ImageUploaderProps {
  onImagesSelected: (base64Array: string[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelected }) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [croppingFiles, setCroppingFiles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const currentTotal = selectedImages.length + croppingFiles.length;
    const remainingSlots = 5 - currentTotal;

    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const newImagesBase64 = await Promise.all(
      filesToProcess.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    setCroppingFiles(prev => [...prev, ...newImagesBase64]);

    // Reset input values
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
    setSelectedImages(prev => [...prev, croppedImage]);
    setCroppingFiles(prev => prev.slice(1)); // Remove the processed file
  };

  const handleCancelCrop = () => {
    setCroppingFiles(prev => prev.slice(1)); // Skip this file
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = () => {
    if (selectedImages.length > 0) {
      onImagesSelected(selectedImages);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 sm:space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Cropper Modal */}
      {croppingFiles.length > 0 && (
        <ImageCropper
          imageSrc={croppingFiles[0]}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}

      {/* Hidden Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {selectedImages.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center p-4 sm:p-8 bg-white border-2 border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="bg-orange-100 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-orange-600 mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-sm sm:text-xl font-bold text-slate-800 mb-0.5 sm:mb-1">צלמו תמונה</h3>
              <p className="text-slate-500 text-[10px] sm:text-sm hidden sm:block">צלמו את המנה או המצרכים</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center p-4 sm:p-8 bg-white border-2 border-slate-100 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="bg-blue-100 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-blue-600 mb-2 sm:mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-sm sm:text-xl font-bold text-slate-800 mb-0.5 sm:mb-1">העלו קבצים</h3>
              <p className="text-slate-500 text-[10px] sm:text-sm hidden sm:block">בחרו עד 5 תמונות מהגלריה</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">התמונות שבחרת ({selectedImages.length}/5)</h3>
            <button
              onClick={() => setSelectedImages([])}
              className="text-slate-400 hover:text-red-500 text-xs sm:text-sm font-medium"
            >
              נקה הכל
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 left-1 p-1 bg-white/80 backdrop-blur-sm rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {selectedImages.length + croppingFiles.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-all"
              >
                <Plus size={24} />
              </button>
            )}
          </div>

          <button
            onClick={handleStartAnalysis}
            className="w-full bg-orange-500 text-white py-3 sm:py-4 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Play size={20} fill="currentColor" className="sm:w-6 sm:h-6" />
            נתח וצור מתכון
          </button>
        </div>
      )}

      <div className="hidden sm:flex bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl p-6 sm:p-10 flex-col items-center justify-center transition-all hover:border-slate-300">
        <ImageIcon className="text-slate-300 mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12" />
        <p className="text-slate-400 font-medium text-center leading-relaxed text-sm sm:text-base">
          ניתן להוסיף עד 5 תמונות<br />
          (למשל: דפים שונים של המתכון או תמונת מצרכים ותוצאה)
        </p>
      </div>
    </div>
  );
};

export default ImageUploader;
