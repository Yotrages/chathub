'use client';

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createStory } from '@/libs/redux/storySlice';
import { 
  XMarkIcon, 
  PhotoIcon, 
  PaintBrushIcon,
  SparklesIcon,
  VideoCameraIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { AppDispatch, RootState } from '@/libs/redux/store';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';


const backgrounds = [
  { 
    name: 'Ocean Blue',
    gradient: 'bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600',
    preview: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #9333ea 100%)'
  },
  { 
    name: 'Sunset',
    gradient: 'bg-gradient-to-br from-orange-400 via-pink-500 to-red-500',
    preview: 'linear-gradient(135deg, #fb923c 0%, #ec4899 50%, #ef4444 100%)'
  },
  { 
    name: 'Forest',
    gradient: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600',
    preview: 'linear-gradient(135deg, #4ade80 0%, #10b981 50%, #0d9488 100%)'
  },
  { 
    name: 'Midnight',
    gradient: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
    preview: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)'
  },
  { 
    name: 'Royal',
    gradient: 'bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600',
    preview: 'linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #2563eb 100%)'
  },
  { 
    name: 'Aurora',
    gradient: 'bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500',
    preview: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #6366f1 100%)'
  }
];

const textStyles = [
  { name: 'Classic', style: 'font-sans text-shadow-lg' },
  { name: 'Bold', style: 'font-bold text-shadow-lg text-xl' },
  { name: 'Elegant', style: 'font-serif text-shadow-lg italic' },
  { name: 'Modern', style: 'font-mono text-shadow-lg tracking-wide' }
];

const textColors = [
  { name: 'White', className: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' },
  { name: 'Black', className: 'text-black drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]' },
  { name: 'Red', className: 'text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' },
  { name: 'Blue', className: 'text-blue-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' },
  { name: 'Yellow', className: 'text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' },
  { name: 'Pink', className: 'text-pink-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' }
];

const MobileCreateStoryPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter()
  const [step, setStep] = useState<'type' | 'create' | 'edit'>('type');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [background, setBackground] = useState(backgrounds[0]);
  const [textStyle, setTextStyle] = useState(textStyles[0]);
  const [textColor, setTextColor] = useState(textColors[0]);
  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [showTextStyles, setShowTextStyles] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allFileInputRef = useRef<HTMLInputElement>(null);
  const textElementRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const { closeForm, resetForm } = useSelector((state: RootState) => state.stories);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type.startsWith('video') ? 'video' : 'image');
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setStep('create');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!textElementRef.current?.contains(e.target as Node)) return;
    e.preventDefault();
    
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = textElementRef.current.getBoundingClientRect();
    
    touchStartPos.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || !textElementRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const textRect = textElementRef.current.getBoundingClientRect();
    
    let newX = touch.clientX - containerRect.left - touchStartPos.current.x;
    let newY = touch.clientY - containerRect.top - touchStartPos.current.y;
    
    newX = Math.max(0, Math.min(newX, containerRect.width - textRect.width));
    newY = Math.max(0, Math.min(newY, containerRect.height - textRect.height));
    
    setTextPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetFormField = () => {
    setText('');
    setFile(null);
    setFileType('image');
    setPreviewUrl(null);
    setBackground(backgrounds[0]);
    setTextStyle(textStyles[0]);
    setTextColor(textColors[0]);
    setTextPosition({ x: 50, y: 50 });
    setShowBackgrounds(false);
    setShowTextStyles(false);
    setShowColorPicker(false);
    setIsDragging(false);
    setStep('type');
  };

  const handleClose = () => {
    resetFormField();
    router.back()
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !text) return toast.error('Please add some content to your story');
    
    setIsLoading(true);
    
    const payload = {
      text,
      file: file || undefined,
      fileType,
      background: file ? undefined : background.gradient,
      textPosition,
      textStyle: `${textStyle.style} ${textColor.className}`
    };

    try {
      await dispatch(createStory(payload));
      if (closeForm && resetForm) {
        resetFormField();
        router.back()
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to create story');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed min-h-screen inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-10">
        {step !== 'type' && (
          <button
            onClick={() => step === 'edit' ? setStep('create') : resetFormField()}
            className="p-2 text-white"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-white font-semibold text-lg flex-1 text-center">
          {step === 'type' ? 'Create Story' : step === 'create' ? 'Your Story' : 'Edit Text'}
        </h1>
        <button
          onClick={handleClose}
          className="p-2 text-white"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Main Content */}
      {step === 'type' ? (
        /* Type Selection */
        <div className="flex-1 p-4 flex flex-col justify-center space-y-4">
          <button
            onClick={() => setStep('create')}
            className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
          >
            <SparklesIcon className="h-10 w-10 mb-2" />
            <span className="font-semibold text-lg">Text Story</span>
          </button>

          <button
            onClick={() => {
              setFileType('image');
              fileInputRef.current?.click();
            }}
            className="h-32 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
          >
            <PhotoIcon className="h-10 w-10 mb-2" />
            <span className="font-semibold text-lg">Photo Story</span>
          </button>

          <button
            onClick={() => {
              setFileType('video');
              fileInputRef.current?.click();
            }}
            className="h-32 bg-gradient-to-br from-pink-500 to-red-500 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
          >
            <VideoCameraIcon className="h-10 w-10 mb-2" />
            <span className="font-semibold text-lg">Video Story</span>
          </button>

          <button
            onClick={() => allFileInputRef.current?.click()}
            className="h-32 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
          >
            <PhotoIcon className="h-10 w-10 mb-2" />
            <span className="font-semibold text-lg">Gallery</span>
          </button>
        </div>
      ) : step === 'create' ? (
        /* Story Preview */
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {previewUrl ? (
              fileType === 'image' ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <video src={previewUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
              )
            ) : (
              <div className={`w-full h-full ${background.gradient} flex items-center justify-center`}>
                {!text && (
                  <button
                    type="button"
                    onClick={() => setStep('edit')}
                    className="text-white/60 text-center"
                  >
                    <SparklesIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-lg">Tap to add text</p>
                  </button>
                )}
              </div>
            )}

            {/* Draggable Text */}
            {text && (
              <div
                ref={textElementRef}
                className={`absolute ${textStyle.style} ${textColor.className} p-4 rounded-lg backdrop-blur-sm bg-black/30 touch-none select-none max-w-[85%] ${
                  isDragging ? 'scale-110' : ''
                } transition-transform text-lg`}
                style={{
                  left: textPosition.x,
                  top: textPosition.y,
                }}
              >
                {text}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="bg-black/90 backdrop-blur-sm p-4 space-y-3">
            {/* Quick Actions */}
            <div className="flex items-center justify-around">
              {!file && (
                <button
                  type="button"
                  onClick={() => setShowBackgrounds(!showBackgrounds)}
                  className="flex flex-col items-center space-y-1 text-white"
                >
                  <div className={`p-3 rounded-full ${showBackgrounds ? 'bg-blue-500' : 'bg-white/20'}`}>
                    <PaintBrushIcon className="h-6 w-6" />
                  </div>
                  <span className="text-xs">Background</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setStep('edit')}
                className="flex flex-col items-center space-y-1 text-white"
              >
                <div className="p-3 rounded-full bg-white/20">
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <span className="text-xs">Text</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTextStyles(!showTextStyles)}
                className="flex flex-col items-center space-y-1 text-white"
              >
                <div className={`p-3 rounded-full ${showTextStyles ? 'bg-blue-500' : 'bg-white/20'}`}>
                  <span className="font-bold text-lg">Aa</span>
                </div>
                <span className="text-xs">Style</span>
              </button>

              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex flex-col items-center space-y-1 text-white"
              >
                <div className={`p-3 rounded-full ${showColorPicker ? 'bg-blue-500' : 'bg-white/20'}`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
                </div>
                <span className="text-xs">Color</span>
              </button>
            </div>

            {/* Background Options */}
            {showBackgrounds && !file && (
              <div className="flex space-x-3 px-1 overflow-x-auto py-2">
                {backgrounds.map((bg, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setBackground(bg);
                      setShowBackgrounds(false);
                    }}
                    className={`flex-shrink-0 w-14 h-14 rounded-full ${
                      background.name === bg.name ? 'ring-4 ring-white scale-110' : ''
                    } transition-all shadow-lg`}
                    style={{ background: bg.preview }}
                  />
                ))}
              </div>
            )}

            {/* Text Style Options */}
            {showTextStyles && (
              <div className="grid grid-cols-4 gap-2">
                {textStyles.map((style, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setTextStyle(style);
                      setShowTextStyles(false);
                    }}
                    className={`p-3 rounded-xl ${
                      textStyle.name === style.name 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/20 text-white'
                    } transition-colors text-sm font-medium`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            )}

            {/* Color Picker */}
            {showColorPicker && (
              <div className="flex space-x-2 overflow-x-auto px-1 py-2">
                {textColors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setTextColor(color);
                      setShowColorPicker(false);
                    }}
                    className={`flex-shrink-0 w-10 h-10 rounded-full ${
                      textColor.name === color.name ? 'ring-4 ring-white scale-110' : ''
                    } transition-all shadow-lg`}
                  >
                    <div className={`w-full h-full rounded-full ${color.className.split(' ')[0]} bg-current`}></div>
                  </button>
                ))}
              </div>
            )}

            {/* Share Button */}
            <button
              type="submit"
              disabled={isLoading || (!file && !text)}
              className="w-full bg-blue-500 text-white py-4 rounded-full font-semibold text-lg disabled:bg-gray-600 disabled:cursor-not-allowed active:scale-95 transition-transform"
            >
              {isLoading ? 'Sharing...' : 'Share Story'}
            </button>
          </div>
        </form>
      ) : (
        /* Text Editor */
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 ${background.gradient} p-6 flex items-center justify-center`}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your story..."
              className="w-full h-full bg-transparent text-white placeholder-white/50 text-2xl text-center resize-none focus:outline-none"
              autoFocus
              maxLength={200}
            />
          </div>

          <div className="bg-black/90 backdrop-blur-sm p-4">
            <div className="text-white/60 text-sm text-center mb-4">
              {text.length}/200 characters
            </div>
            <button
              onClick={() => setStep('create')}
              disabled={!text}
              className="w-full bg-blue-500 text-white py-4 rounded-full font-semibold text-lg disabled:bg-gray-600 disabled:cursor-not-allowed active:scale-95 transition-transform flex items-center justify-center space-x-2"
            >
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept={fileType === 'image' ? 'image/*' : 'video/*'}
        onChange={handleFileChange}
        ref={fileInputRef}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        ref={allFileInputRef}
        className="hidden"
      />
    </div>
  );
};

export default MobileCreateStoryPage;