import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GalleryItem } from '../types';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryItem[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  salonName: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  salonName,
}) => {
  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((currentIndex - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate((currentIndex + 1) % images.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Bar with Title and Close Button */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
        <div>
          <span className="text-xs uppercase tracking-widest text-purple-300 font-semibold">
            {salonName} · Galería
          </span>
          <h4 className="text-sm font-medium text-slate-200">
            {currentImage.title} ({currentIndex + 1} de {images.length})
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Cerrar visor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-w-4xl max-h-[80vh] flex items-center justify-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={currentImage.title}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl border border-white/10"
        />

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:-left-12 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-lg"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:-right-12 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-lg"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Category Tag */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 text-center">
        <span className="px-4 py-1.5 rounded-full bg-purple-900/80 text-purple-200 text-xs font-medium border border-purple-400/30 backdrop-blur-md capitalize">
          Categoría: {currentImage.category}
        </span>
      </div>
    </div>
  );
};
