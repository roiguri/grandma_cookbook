
import React, { useRef, useState } from 'react';
import { Camera, Upload, Image as ImageIcon, X, Plus, Play } from 'lucide-react';

interface ImageUploaderProps {
  onImagesSelected: (base64Array: string[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelected }) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const remainingSlots = 5 - selectedImages.length;
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

    setSelectedImages(prev => [...prev, ...newImagesBase64].slice(0, 5));
    
    // Reset input values so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Hidden Inputs - kept outside the ternary so refs are always stable */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                <Camera size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">צלמו תמונה</h3>
              <p className="text-slate-500 text-sm">צלמו את המנה או המצרכים</p>
            </div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Upload size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">העלו קבצים</h3>
              <p className="text-slate-500 text-sm">בחרו עד 5 תמונות מהגלריה</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">התמונות שבחרת ({selectedImages.length}/5)</h3>
            <button 
              onClick={() => setSelectedImages([])}
              className="text-slate-400 hover:text-red-500 text-sm font-medium"
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
            {selectedImages.length < 5 && (
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
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Play size={24} fill="currentColor" />
            נתח וצור מתכון
          </button>
        </div>
      )}

      <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center transition-all hover:border-slate-300">
        <ImageIcon size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-400 font-medium text-center leading-relaxed">
          ניתן להוסיף עד 5 תמונות<br/>
          (למשל: דפים שונים של המתכון או תמונת מצרכים ותוצאה)
        </p>
      </div>
    </div>
  );
};

export default ImageUploader;
