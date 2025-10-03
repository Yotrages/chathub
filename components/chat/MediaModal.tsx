'use client';
import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  type: 'image' | 'video';
  fileName?: string;
}

export const MediaModal = ({ isOpen, onClose, src, type, fileName }: MediaModalProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      console.log('MediaModal opened with:', { src, type, fileName });
      setScale(1);
      setRotation(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!mounted || !isOpen) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `download-${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      const a = document.createElement('a');
      a.href = src;
      a.download = fileName || `download-${Date.now()}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-2 sm:p-4"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-2 right-2 sm:top-4 sm:right-4 bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
        style={{ zIndex: 10000 }}
        aria-label="Close modal"
      >
        <X size={20} />
      </button>

      {/* Controls for images */}
      {type === 'image' && (
        <div className="fixed top-2 left-2 sm:top-4 sm:left-4 flex gap-2" style={{ zIndex: 10000 }}>
          <button
            onClick={handleZoomIn}
            className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleRotate}
            className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
            aria-label="Rotate"
            title="Rotate 90°"
          >
            <RotateCw size={16} />
          </button>
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
        style={{ zIndex: 10000 }}
        aria-label="Download file"
        title="Download"
      >
        <Download size={20} />
      </button>

      {/* Media content */}
      <div className="max-w-full max-h-full flex items-center justify-center" style={{ zIndex: 9999 }}>
        {type === 'image' ? (
          <img
            src={src}
            alt="Full size view"
            className="max-w-full max-h-full object-contain transition-transform duration-300 cursor-pointer select-none"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
            onClick={handleReset}
            draggable={false}
            title="Click to reset zoom and rotation"
          />
        ) : (
          <video
            src={src}
            controls
            className="max-w-full max-h-full"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
            autoPlay
            controlsList="nodownload"
          />
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};