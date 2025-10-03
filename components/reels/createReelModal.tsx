'use client';

import React, { useState, useRef, useEffect } from 'react';
import { XCircleIcon, PhotoIcon, TrashIcon, PlayIcon, PauseIcon, LockClosedIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { FilmIcon, SparklesIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useCreateReel } from '@/hooks/useReels';
import Input from '../ui/Input';
import { EyeIcon } from 'lucide-react';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateReelModal: React.FC<CreateReelModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
   const [visibility, setVisibility] = useState<
      "public" | "friends" | "private"
    >("public");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setDragActive(false);
    setIsPlaying(true);
  };

  const { mutate, isPending } = useCreateReel(() => {
    resetForm();
    onClose();
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    const maxSize = 50 * 1024 * 1024; 
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

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

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const visibilityOptions = [
      {
        value: "public",
        label: "Public",
        description: "Everyone can see this reel",
        icon: GlobeAltIcon,
      },
      {
        value: "friends",
        label: "Followers",
        description: "Only your followers can see this",
        icon: UserGroupIcon,
      },
      {
        value: "private",
        label: "Private",
        description: "Only you can see this reel",
        icon: LockClosedIcon,
      },
    ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[95vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FilmIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create Reel</h2>
                <p className="text-purple-100 text-sm">Share your amazing content</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
              disabled={isPending}
            >
              <XCircleIcon className='text-black' fontSize={24} />
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-2 right-20 opacity-20">
            <SparklesIcon className="h-8 w-8" />
          </div>
          <div className="absolute bottom-2 left-20 opacity-20">
            <SparklesIcon className="h-6 w-6" />
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Upload Video
              </label>
              <div 
                className={`relative h-72 rounded-xl overflow-hidden border-2 border-dashed transition-all duration-300 ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-50 scale-105' 
                    : previewUrl 
                    ? 'border-gray-300 shadow-lg' 
                    : 'border-gray-300 bg-gray-50 hover:border-purple-300 hover:bg-purple-25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="relative w-full h-full group">
                    <video 
                      ref={videoRef}
                      src={previewUrl} 
                      className="w-full h-full object-cover rounded-xl" 
                      muted 
                      autoPlay 
                      loop 
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        className="p-4 bg-white/90 text-gray-800 rounded-full hover:bg-white transition-all duration-200 shadow-lg"
                      >
                        {isPlaying ? (
                          <PauseIcon className="h-8 w-8" />
                        ) : (
                          <PlayIcon className="h-8 w-8 ml-1" />
                        )}
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>

                    {/* File Info */}
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                      {file?.name}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                    <div className="p-4 bg-purple-100 rounded-full mb-4">
                      <PhotoIcon className="h-12 w-12 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {dragActive ? 'Drop your video here!' : 'Upload your reel'}
                    </h3>
                    <p className="text-sm text-center text-gray-500 mb-2">
                      Drag & drop a video file or click to browse
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="bg-gray-200 px-2 py-1 rounded">MP4</span>
                      <span className="bg-gray-200 px-2 py-1 rounded">MOV</span>
                      <span className="bg-gray-200 px-2 py-1 rounded">Max 50MB</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
                disabled={isPending}
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                {file ? 'Change Video' : 'Browse Files'}
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
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Reel Title
              </label>
              <div className="relative">
                <Input 
                  value={title}
                  placeholder="What's your reel about? Make it catchy! ✨"
                  width="100%"
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                  maxLength={100}
                  border='none'
                  className="pr-16 text-lg border-2 border-gray-200 focus:border-purple-500 rounded-lg transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    title.length > 80 
                      ? 'bg-red-100 text-red-600' 
                      : title.length > 60 
                      ? 'bg-yellow-100 text-yellow-600' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {title.length}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility Section */}
                        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                          <div className="flex items-center space-x-2">
                            <EyeIcon className="h-5 w-5 text-purple-600" />
                            <h2 className="text-lg font-semibold text-gray-800">
                              Who can see this?
                            </h2>
                          </div>
            
                          <div className="space-y-3">
                            {visibilityOptions.map((option) => {
                              const IconComponent = option.icon;
                              return (
                                <label
                                  key={option.value}
                                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    visibility === option.value
                                      ? "border-purple-500 bg-purple-50"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="visibility"
                                    value={option.value}
                                    checked={visibility === option.value}
                                    onChange={(e) =>
                                      setVisibility(e.target.value as typeof visibility)
                                    }
                                    className="sr-only"
                                  />
                                  <div
                                    className={`p-2 rounded-lg ${
                                      visibility === option.value
                                        ? "bg-purple-500 text-white"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`font-medium ${
                                        visibility === option.value
                                          ? "text-purple-700"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {option.label}
                                    </div>
                                    <div className="text-sm text-gray-500 leading-tight">
                                      {option.description}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !file || !title.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-xl font-semibold text-lg relative overflow-hidden group"
            >
              {isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Magic...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  Share Your Reel
                </div>
              )}
              
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:animate-shimmer"></div>
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out;
        }
        
        .bg-purple-25 {
          background-color: #faf7ff;
        }
      `}</style>
    </div>
  );
};

export default CreateReelModal;