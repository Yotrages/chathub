'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  PhotoIcon, 
  TrashIcon, 
  PlayIcon, 
  PauseIcon,
  EyeIcon,
  UserGroupIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { FilmIcon, SparklesIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useCreateReel } from '@/hooks/useReels';
import Input from '@/components/ui/Input';
import { useRouter } from 'next/navigation';



const CreateReelPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter()
  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setVisibility('public');
    setDragActive(false);
    setIsPlaying(true);
  };

  const { mutate, isPending } = useCreateReel((data) => {
    resetForm();
    router.push(`/reels/${data.reel._id}`)
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      title: title.trim(),
      visibility: visibility
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
      value: 'public',
      label: 'Public',
      description: 'Everyone can see this reel',
      icon: GlobeAltIcon
    },
    {
      value: 'followers',
      label: 'Followers',
      description: 'Only your followers can see this',
      icon: UserGroupIcon
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Only you can see this reel',
      icon: LockClosedIcon
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
              disabled={isPending}
            >
              <ArrowLeftIcon className="h-6 w-6 text-white" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <FilmIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Create Reel</h1>
                <p className="text-purple-100 text-xs">Share your story</p>
              </div>
            </div>
          </div>
          
          {/* Decorative sparkle */}
          <div className="opacity-30">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Upload Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <PhotoIcon className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">Upload Video</h2>
              </div>
              
              <div 
                className={`relative rounded-xl overflow-hidden border-2 border-dashed transition-all duration-300 ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-50' 
                    : previewUrl 
                    ? 'border-gray-300 shadow-inner' 
                    : 'border-gray-300 bg-gray-50'
                } ${previewUrl ? 'h-80' : 'h-64'}`}
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
                      className="w-full h-full object-cover rounded-lg" 
                      muted 
                      autoPlay 
                      loop 
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-active:opacity-100 sm:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={togglePlayPause}
                        className="p-3 bg-white/90 text-gray-800 rounded-full shadow-lg active:scale-95 transition-transform"
                      >
                        {isPlaying ? (
                          <PauseIcon className="h-6 w-6" />
                        ) : (
                          <PlayIcon className="h-6 w-6 ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg active:scale-95 transition-transform"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>

                    {/* File Info */}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs backdrop-blur-sm max-w-[70%] truncate">
                      {file?.name}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <div className="p-3 bg-purple-100 rounded-full mb-3">
                      <PhotoIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-2 text-center">
                      {dragActive ? 'Drop your video here!' : 'Upload your reel'}
                    </h3>
                    <p className="text-sm text-center text-gray-500 mb-3 px-2">
                      Tap to browse or drag & drop a video file
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
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
                className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg font-medium shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                disabled={isPending}
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                {file ? 'Change Video' : 'Browse Files'}
              </button>

              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
            </div>

            {/* Title Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Reel Details</h2>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <div className="relative">
                  <Input 
                    value={title}
                    placeholder="What's your reel about? ✨"
                    width="100%"
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending}
                    maxLength={100}
                    border='none'
                    className="text-base border-2 border-gray-200 focus:border-purple-500 rounded-lg transition-colors pr-14"
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
            </div>

            {/* Visibility Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <EyeIcon className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">Who can see this?</h2>
              </div>
              
              <div className="space-y-3">
                {visibilityOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <label 
                      key={option.value}
                      className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        visibility === option.value 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                        className="sr-only"
                      />
                      <div className={`p-2 rounded-lg ${
                        visibility === option.value 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          visibility === option.value ? 'text-purple-700' : 'text-gray-700'
                        }`}>
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
          </form>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isPending || !file || !title.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100 relative overflow-hidden"
        >
          {isPending ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Creating Magic...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 mr-2" />
              Share Your Reel
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateReelPage;