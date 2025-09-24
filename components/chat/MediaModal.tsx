'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
interface MediaModalProps {
  selectedMedia: { type: 'image' | 'video'; url: string } | null;
  onClose: () => void;
}
export const MediaModal: React.FC<MediaModalProps> = ({ selectedMedia, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  if (!selectedMedia) return null;
  const { type, url } = selectedMedia;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'image' ? (
          <img
            src={url}
            alt="Full image"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={url}
            controls
            className="max-w-full max-h-full object-contain"
            autoPlay
          />
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
          aria-label="Close media"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};