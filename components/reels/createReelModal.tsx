'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XCircleIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useCreateReel } from '@/hooks/useReels';
import Input from '../ui/Input';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateReelModal: React.FC<CreateReelModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

   const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setDragActive(false);
  };

  // Move hook calls before any conditional returns
  const { mutate, isPending } = useCreateReel(() => {
    resetForm();
    onClose();
  });

  // Cleanup preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Early return after all hooks
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a video file');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title for your reel');
      return;
    }

    const payload = {
      fileUrl: file,
      title: title.trim()
    };

    mutate(payload);
  };

 

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isPending}
        >
          <XCircleIcon className="h-6 w-6 text-gray-500" />
        </button>
        
        <h2 className="text-xl font-bold mb-4">Create Reel</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div 
            className={`relative h-64 rounded-lg overflow-hidden border-2 border-dashed transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : previewUrl 
                ? 'border-gray-300' 
                : 'border-gray-300 bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <div className="relative w-full h-full">
                <video 
                  src={previewUrl} 
                  className="w-full h-full object-cover" 
                  muted 
                  autoPlay 
                  controls 
                  loop 
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <PhotoIcon className="h-12 w-12 mb-2" />
                <p className="text-sm text-center">
                  {dragActive ? 'Drop your video here' : 'Drag & drop a video file or click to upload'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Max size: 50MB</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPending}
            >
              <PhotoIcon className="h-5 w-5 mr-2" />
              {file ? 'Change Video' : 'Upload Video'}
            </button>
          </div>

          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          
          {/* Title Input */}
          <Input 
            value={title}
            placeholder="Enter a catchy title..."
            width="100%"
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            maxLength={100}
          />
          
          {/* Character Counter */}
          <div className="text-right text-xs text-gray-500">
            {title.length}/100 characters
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !file || !title.trim()}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Posting...' : 'Post Reel'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateReelModal;