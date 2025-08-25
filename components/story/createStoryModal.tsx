'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { createStory } from '@/libs/redux/storySlice';
import { 
  XMarkIcon, 
  PhotoIcon, 
  PaintBrushIcon,
  FaceSmileIcon,
  SparklesIcon,
  VideoCameraIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { AppDispatch, RootState } from '@/libs/redux/store';
import toast from 'react-hot-toast';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  { name: 'Classic', style: 'font-sans text-white text-shadow-lg' },
  { name: 'Bold', style: 'font-bold text-white text-shadow-lg text-xl' },
  { name: 'Elegant', style: 'font-serif text-white text-shadow-lg italic' },
  { name: 'Modern', style: 'font-mono text-white text-shadow-lg tracking-wide' }
];

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose }) => {
  const dispatch: AppDispatch = useDispatch();
  const [step, setStep] = useState<'type' | 'create'>('type');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [background, setBackground] = useState(backgrounds[0]);
  const [textStyle, setTextStyle] = useState(textStyles[0]);
  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [showTextStyles, setShowTextStyles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allFileInputRef = useRef<HTMLInputElement>(null);
  const textElementRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
          setShowEmojiPicker(false);
        }
      };
  
      if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      setShowEmojiPicker(false)
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = textElementRef.current?.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    const maxX = containerRect.width - (textElementRef.current?.offsetWidth || 0);
    const maxY = containerRect.height - (textElementRef.current?.offsetHeight || 0);
    
    setTextPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const {closeForm, resetForm} = useSelector((state: RootState) => state.stories)

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleClose = () => {
    resetFormField();
    onClose();
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type.startsWith('video') ? 'video' : 'image');
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setStep('create');
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
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
      textStyle: textStyle.style
    };

    try {
      await dispatch(createStory(payload));
      if (closeForm && resetForm) {
      resetFormField();
      onClose();
      }
    } catch (error) {
      console.log(error)
      toast.error('Failed to create story');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormField = () => {
    setText('');
    setFile(null);
    setFileType('image');
    setPreviewUrl(null);
    setBackground(backgrounds[0]);
    setTextStyle(textStyles[0]);
    setTextPosition({ x: 50, y: 50 });
    setShowEmojiPicker(false);
    setShowBackgrounds(false);
    setShowTextStyles(false);
    setIsDragging(false);
    setStep('type');
  };

  
  
 

  return (
    <div  tabIndex={-1} role='dialog' aria-labelledby='emoji-picker' aria-modal="true"  className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {step === 'create' && (
            <button
              onClick={() => setStep('type')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <h2 className="text-xl font-bold text-gray-900 flex-1 text-center">
            {step === 'type' ? 'Create Story' : 'Add to Story'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {step === 'type' ? (
          /* Story Type Selection */
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Text Story */}
              <button
                onClick={() => setStep('create')}
                className="group relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl overflow-hidden hover:scale-105 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative h-full flex flex-col items-center justify-center text-white">
                  <SparklesIcon className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Text Story</span>
                </div>
              </button>

              {/* Photo Story */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFileType('image');
                  fileInputRef.current?.click();
                }}
                className="group relative h-32 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl overflow-hidden hover:scale-105 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative h-full flex flex-col items-center justify-center text-white">
                  <PhotoIcon className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Photo Story</span>
                </div>
              </button>

              {/* Video Story */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFileType('video');
                  fileInputRef.current?.click();
                }}
                className="group relative h-32 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl overflow-hidden hover:scale-105 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative h-full flex flex-col items-center justify-center text-white">
                  <VideoCameraIcon className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Video Story</span>
                </div>
              </button>

              {/* Upload from Gallery */}
              <button
                onClick={() => allFileInputRef.current?.click()}
                className="group relative h-32 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl overflow-hidden hover:scale-105 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative h-full flex flex-col items-center justify-center text-white">
                  <PhotoIcon className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Gallery</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Story Creation */
          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(95vh-80px)]">
            {/* Preview Area */}
            <div className="relative flex-1 bg-gray-900 overflow-hidden">
              {previewUrl ? (
                fileType === 'image' ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={previewUrl} className="w-full h-full object-cover" muted autoPlay loop />
                )
              ) : (
                <div className={`w-full h-full ${background.gradient} flex items-center justify-center`}>
                  {!text && (
                    <div className="text-white/60 text-center">
                      <SparklesIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Tap to add text</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Draggable Text */}
              {text && (
                <div
                  ref={textElementRef}
                  className={`absolute ${textStyle.style} p-3 rounded-lg backdrop-blur-sm bg-black/30 cursor-move select-none max-w-[80%] ${
                    isDragging ? 'z-10 scale-105' : ''
                  } transition-transform`}
                  style={{
                    left: textPosition.x,
                    top: textPosition.y,
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {text}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-white border-t border-gray-100">
              {/* Text Input */}
              <div className="p-4 relative border-b border-gray-100">
                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Add text to your story..."
                    className="w-full border border-gray-200 rounded-xl p-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(true)}
                    className="absolute right-3 top-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaceSmileIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} onKeyDown={handleKeyDown} className="absolute bottom-16 right-4 mb-2 z-20">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>

              {/* Style Controls */}
              <div className="flex items-center justify-between p-4 space-x-4">
                {/* Background Selector */}
                {!file && (
                  <button
                    type="button"
                    onClick={() => setShowBackgrounds(!showBackgrounds)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <PaintBrushIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Background</span>
                  </button>
                )}

                {/* Text Style Selector */}
                {text && (
                  <button
                    type="button"
                    onClick={() => setShowTextStyles(!showTextStyles)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-sm font-medium">Style</span>
                  </button>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || (!file && !text)}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Sharing...' : 'Share Story'}
                </button>
              </div>

              {/* Background Options */}
              {showBackgrounds && !file && (
                <div className="px-4 pb-4">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {backgrounds.map((bg, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setBackground(bg);
                          setShowBackgrounds(false);
                        }}
                        className={`flex-shrink-0 w-12 h-12 rounded-full border-3 ${
                          background.name === bg.name ? 'border-blue-500 scale-110' : 'border-white'
                        } hover:scale-105 transition-all shadow-lg`}
                        style={{ background: bg.preview }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Text Style Options */}
              {showTextStyles && text && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {textStyles.map((style, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setTextStyle(style);
                          setShowTextStyles(false);
                        }}
                        className={`p-3 rounded-lg border-2 text-left ${
                          textStyle.name === style.name 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        } transition-colors`}
                      >
                        <span className="text-sm font-medium">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          accept={fileType === 'image' ? 'image/*' : 'video/*'}
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
        <input
          type="file"
          accept={'/*'}
          onChange={handleFileChange}
          ref={allFileInputRef}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default CreateStoryModal;