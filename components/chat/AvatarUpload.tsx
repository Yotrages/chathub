// File: src/frontend/components/chat/AvatarUpload.tsx
'use client';
import { useState, useRef } from 'react';
import { X, Upload, User } from 'lucide-react';

interface AvatarUploadProps {
  label?: string;
  accept?: string;
  onFileSelect: (file: File | null) => void;
  error?: string;
  preview?: boolean;
  maxSize?: number; // in MB
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  label = 'Upload Avatar',
  accept = 'image/*',
  onFileSelect,
  error,
  preview = true,
  maxSize = 5,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return false;
    }
    if (!allowedTypes.includes(file.type)) {
      alert(`File type must be one of: ${allowedTypes.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    onFileSelect(file);

    if (preview && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-500' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        {previewUrl ? (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover mx-auto"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
            {uploadProgress > 0 && (
              <div className="w-24 bg-gray-200 rounded-full h-2 mt-2 mx-auto">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};