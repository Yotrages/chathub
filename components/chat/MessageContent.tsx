'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, Eye, Image, File, Mic, Video, Play, Pause, X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types';
import Link from 'next/link';
import { api } from '@/libs/axios/config';
import { toast } from 'react-hot-toast';

interface MessageContentProps {
  message: Message;
  isOwn: boolean;
  onClose: () => void;
  isEditing: boolean;
  otherParticipantsCount: number;
}

interface PostPreview {
  _id: string;
  content: string;
  authorId: { username: string; avatar?: string };
  images?: string[];
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  type: 'image' | 'video';
  fileName?: string;
}

const MediaModal = ({ isOpen, onClose, src, type, fileName }: MediaModalProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  if (!isOpen) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
        aria-label="Close modal"
      >
        <X size={20} />
      </button>

      {/* Controls for images */}
      {type === 'image' && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex gap-2">
          <button
            onClick={handleZoomIn}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleRotate}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
            aria-label="Rotate"
          >
            <RotateCw size={16} />
          </button>
        </div>
      )}

      {/* Download button */}
      <a
        href={src}
        download={fileName}
        className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all"
        aria-label="Download file"
      >
        <Download size={20} />
      </a>

      {/* Media content */}
      <div className="max-w-full max-h-full flex items-center justify-center">
        {type === 'image' ? (
          <img
            src={src}
            alt="Full size view"
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`
            }}
            onClick={handleReset}
          />
        ) : (
          <video
            src={src}
            controls
            className="max-w-full max-h-full"
            autoPlay
          />
        )}
      </div>
    </div>
  );
};

export const MessageContent = ({ message, isOwn, onClose, isEditing, otherParticipantsCount }: MessageContentProps) => {
  const [imageError, setImageError] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [postPreview, setPostPreview] = useState<PostPreview | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [mediaModal, setMediaModal] = useState<{isOpen: boolean, src: string, type: 'image' | 'video', fileName?: string}>({
    isOpen: false,
    src: '',
    type: 'image',
    fileName: ''
  });
  const waveformRef = useRef<HTMLDivElement>(null);
  
  const { editMessage } = useChat();

  useEffect(() => {
    if (message.messageType === 'post' && message.postId) {
      const fetchPostPreview = async () => {
        try {
          const response = await api.get(`/posts/${message.postId}`);
          setPostPreview(response.data);
        } catch (error) {
          console.error('Error fetching post preview:', error);
          toast.error('Failed to load post preview');
        }
      };
      fetchPostPreview();
    }
  }, [message.messageType, message.postId]);

  const handleEdit = (): void => {
    if (isEditing && editedContent.trim()) {
      editMessage(message._id, editedContent);
      onClose();
    }
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // const formatFileSize = (bytes: number): string => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || 'file';
  };

  const getFileIcon = (fileName: string) => {
    const ext = getFileExtension(fileName);
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoTypes = ['mp4', 'avi', 'mov', 'mkv'];
    const audioTypes = ['mp3', 'wav', 'aac', 'ogg'];
    const docTypes = ['pdf', 'doc', 'docx', 'txt'];
    
    if (imageTypes.includes(ext)) return <Image size={20} />;
    if (videoTypes.includes(ext)) return <Video size={20} />;
    if (audioTypes.includes(ext)) return <Mic size={20} />;
    if (docTypes.includes(ext)) return <File size={20} />;
    return <File size={20} />;
  };

  const handleAudioPlay = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef) {
      setCurrentTime(audioRef.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef) {
      setDuration(audioRef.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      audioRef.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const openMediaModal = (src: string, type: 'image' | 'video', fileName?: string) => {
    setMediaModal({ isOpen: true, src, type, fileName });
  };

  const closeMediaModal = () => {
    setMediaModal({ isOpen: false, src: '', type: 'image', fileName: '' });
  };

  const allRead = message.readBy?.length >= otherParticipantsCount;

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;
    
    const replySender = typeof message.replyTo.senderId === 'string'
      ? { username: 'Unknown' }
      : message.replyTo.senderId;
    
    return (
      <div className={`p-2 sm:p-3 mb-2 sm:mb-3 rounded-lg sm:rounded-xl border-l-4 transition-all duration-200 ${
        isOwn 
          ? 'bg-blue-400/30 border-blue-200 backdrop-blur-sm' 
          : 'bg-gray-50 border-blue-500 shadow-sm'
      }`}>
        <p className={`text-xs font-semibold mb-1 truncate ${
          isOwn ? 'text-blue-100' : 'text-blue-600'
        }`}>
          {replySender.username}
        </p>
        
        {message.replyTo.messageType === 'image' && (
          <div className="flex items-center space-x-2 min-w-0">
            <div className={`p-1 rounded flex-shrink-0 ${isOwn ? 'bg-blue-300' : 'bg-blue-100'}`}>
              <Image size={12} className={isOwn ? 'text-blue-700' : 'text-blue-600'} />
            </div>
            <p className={`text-xs truncate ${
              isOwn ? 'text-blue-100' : 'text-gray-600'
            }`}>
              {message.replyTo.content || 'Photo'}
            </p>
          </div>
        )}
        
        {/* Similar updates for other message types */}
        {message.replyTo.messageType === 'text' && (
          <p className={`text-xs line-clamp-2 ${
            isOwn ? 'text-blue-100' : 'text-gray-600'
          }`}>
            {message.replyTo.content}
          </p>
        )}
      </div>
    );
  };

  const renderMessageContent = () => {
     const getCallIcon = (callStatus: string | undefined, isVideo: boolean) => {
    switch (callStatus) {
      case "missed":
        return isVideo ? "📹❌" : "📞❌";
      case "ended":
        return isVideo ? "📹✅" : "📞✅";
      case "declined":
        return isVideo ? "📹🚫" : "📞🚫";
      case "failed":
        return isVideo ? "📹⚠️" : "📞⚠️";
      default:
        return isVideo ? "📹" : "📞";
    }
  };
    switch (message.messageType) {
      case 'image':
        return (
          <div className="relative w-full">
            {!imageError ? (
              <div className="relative overflow-hidden rounded-lg w-full">
                <img
                  src={message.fileUrl}
                  alt="Shared image"
                  className="w-full max-w-full h-auto max-h-48 sm:max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-all duration-300 shadow-md"
                  onError={() => setImageError(true)}
                  onClick={() => openMediaModal(message.fileUrl!, 'image', message.fileName)}
                  aria-label="View image in full screen"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-full p-1">
                  <Eye size={16} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 sm:p-6 rounded-lg w-full border-2 border-dashed border-gray-300">
                <Eye className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-600 text-center font-medium">Image unavailable</p>
              </div>
            )}
            {message.content && (
              <p className={`mt-2 sm:mt-3 text-sm leading-relaxed break-words ${
                isOwn ? 'text-blue-50' : 'text-gray-700'
              }`}>
                {message.content}
              </p>
            )}
          </div>
        );
        
      case 'audio':
        return (
          <div className="w-full min-w-0">
            {!mediaError ? (
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-inner transition-all duration-300 ${
                isOwn 
                  ? 'bg-blue-400/40 backdrop-blur-sm' 
                  : 'bg-white shadow-md border border-gray-100'
              }`}>
                {/* Hidden native audio element for control */}
                <audio
                  ref={setAudioRef}
                  src={message.fileUrl}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onLoadedMetadata={handleAudioLoadedMetadata}
                  onEnded={handleAudioEnded}
                  onError={() => setMediaError(true)}
                  preload="metadata"
                  style={{ display: 'none' }}
                />
               
                {/* Enhanced Audio Player UI */}
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <button
                    onClick={handleAudioPlay}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex-shrink-0 ${
                      isOwn
                        ? 'bg-white text-blue-500 hover:bg-blue-50'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>
                 
                  <div className="flex-1 min-w-0">
                    {/* Waveform-style progress bar */}
                    <div
                      ref={waveformRef}
                      className={`h-6 sm:h-8 rounded-full cursor-pointer relative overflow-hidden ${
                        isOwn ? 'bg-blue-300/50' : 'bg-gray-200'
                      }`}
                      onClick={handleSeek}
                    >
                      {/* Waveform bars */}
                      <div className="absolute inset-0 flex items-center justify-center space-x-0.5 px-2">
                        {Array.from({ length: 30 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-0.5 rounded-full transition-all duration-200 ${
                              i < (currentTime / duration * 30) 
                                ? (isOwn ? 'bg-white' : 'bg-blue-500') 
                                : (isOwn ? 'bg-blue-200' : 'bg-gray-400')
                            }`}
                            style={{
                              height: `${Math.max(6, Math.random() * 20)}px`
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Progress overlay */}
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${
                          isOwn ? 'bg-white/30' : 'bg-blue-500/30'
                        }`}
                        style={{
                          width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                        }}
                      />
                    </div>
                   
                    {/* Time display */}
                    <div className={`flex justify-between text-xs mt-1 sm:mt-2 font-medium ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300">
                <Mic className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-600 text-center font-medium">Audio unavailable</p>
              </div>
            )}
            {message.content && (
              <p className={`mt-2 sm:mt-3 text-sm leading-relaxed break-words ${
                isOwn ? 'text-blue-50' : 'text-gray-700'
              }`}>
                {message.content}
              </p>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="w-full overflow-hidden flex-1">
            {!mediaError ? (
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <video
                  src={message.fileUrl}
                  className="w-full h-32 sm:h-48 object-cover rounded-lg cursor-pointer"
                  onClick={() => openMediaModal(message.fileUrl!, 'video', message.fileName)}
                  aria-label="Play video in full screen"
                  poster=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none rounded-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 hover:bg-white rounded-full p-3 cursor-pointer transition-all">
                    <Play size={20} className="text-gray-800 ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 sm:p-6 rounded-lg border-2 border-dashed border-gray-300">
                <Video className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-600 text-center font-medium">Video unavailable</p>
              </div>
            )}
            {message.content && (
              <p className={`mt-2 sm:mt-3 text-sm leading-relaxed break-words ${
                isOwn ? 'text-blue-50' : 'text-gray-700'
              }`}>
                {message.content}
              </p>
            )}
          </div>
        );

        case 'call': 
        return (
          <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm max-w-xs text-center">
              <span className="mr-2">{getCallIcon(message.callStatus, message.content.includes("Video"))}</span>
              {message.content}
            </div>
        )
        
      case 'file':
        return (
          <div className={`p-3 sm:p-4 rounded-lg overflow-hidden sm:rounded-xl w-full transition-all duration-300 hover:shadow-md ${
            isOwn ? 'bg-blue-400/40' : 'bg-gray-50 border border-gray-200'
          }`}>
            <a
              href={message.fileUrl}
              download={message.fileName}
              className="flex items-center space-x-3 group min-w-0"
              aria-label={`Download file ${message.fileName || 'File'}`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 flex-shrink-0 ${
                isOwn ? 'bg-white/90 text-blue-600' : 'bg-blue-500 text-white'
              }`}>
                {getFileIcon(message.fileName || '')}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  isOwn ? 'text-white' : 'text-gray-800'
                }`}>
                  {message.fileName || 'Document'}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className={`text-xs ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {/* {message.fileSize ? formatFileSize(message.fileSize) : 'Unknown size'} */}
                  </p>
                  <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>•</span>
                  <p className={`text-xs ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {getFileExtension(message.fileName || '').toUpperCase()}
                  </p>
                </div>
              </div>
              <div className={`p-2 rounded-full transition-all duration-300 group-hover:scale-110 ${
                isOwn ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                <Download size={16} className={isOwn ? 'text-white' : 'text-blue-500'} />
              </div>
            </a>
            {message.content && (
              <p className={`mt-3 text-sm leading-relaxed break-words ${
                isOwn ? 'text-blue-50' : 'text-gray-700'
              }`}>
                {message.content}
              </p>
            )}
          </div>
        );
        
      case 'post':
        return (
          <div className={`rounded-lg sm:rounded-xl overflow-hidden w-full border transition-all duration-300 hover:shadow-lg ${
            isOwn 
              ? 'bg-blue-400/40 border-blue-300/50' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            {postPreview ? (
              <div className="p-3 sm:p-4">
                <div className="flex items-start space-x-3 min-w-0">
                  {postPreview.images?.[0] && (
                    <img
                      src={postPreview.images[0]}
                      alt="Post preview"
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover shadow-sm flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold mb-2 truncate ${
                      isOwn ? 'text-blue-100' : 'text-blue-600'
                    }`}>
                      {postPreview.authorId.username}
                    </p>
                    <p className={`text-sm line-clamp-3 leading-relaxed break-words ${
                      isOwn ? 'text-white' : 'text-gray-700'
                    }`}>
                      {postPreview.content}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/post/${message.postId}`}
                  className={`inline-block mt-3 text-sm font-medium transition-colors ${
                    isOwn 
                      ? 'text-blue-100 hover:text-white' 
                      : 'text-blue-500 hover:text-blue-600'
                  }`}
                  aria-label="View shared post"
                >
                  View Post →
                </Link>
              </div>
            ) : (
              <div className="p-3 sm:p-4">
                <p className={`text-sm leading-relaxed break-words ${
                  isOwn ? 'text-white' : 'text-gray-800'
                }`}>
                  {message.content}
                </p>
                {message.postId ? (
                  <Link
                    href={`/post/${message.postId}`}
                    className={`inline-block mt-3 text-sm font-medium transition-colors ${
                      isOwn 
                        ? 'text-blue-100 hover:text-white' 
                        : 'text-blue-500 hover:text-blue-600'
                    }`}
                    aria-label="View shared post"
                  >
                    View Post →
                  </Link>
                ) : (
                  <p className={`text-sm mt-2 ${
                    isOwn ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    Post unavailable
                  </p>
                )}
              </div>
            )}
          </div>
        );
        
      default:
        return isEditing ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full min-w-0">
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 text-gray-800 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
              onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
              aria-label="Edit message"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm text-sm"
                aria-label="Save edited message"
              >
                Save
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-sm text-sm"
                aria-label="Cancel editing"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm whitespace-pre-wrap leading-relaxed break-words ${
            isOwn ? 'text-white' : 'text-gray-800'
          }`}>
            {message.content}
          </p>
        );
    }
  };

  return (
    <>
      <div className="w-full min-w-0">
        {renderReplyPreview()}
        {renderMessageContent()}
        <div className={`flex items-center justify-between mt-2 sm:mt-3 text-xs ${
          isOwn ? 'text-blue-100/80' : 'text-gray-500'
        }`}>
          <span className="font-medium">
            {formatTime(message.createdAt)}
            {message.edited && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                isOwn ? 'bg-blue-400/50 text-blue-100' : 'bg-gray-100 text-gray-600'
              }`}>
                edited
              </span>
            )}
          </span>
          {isOwn && (
            <div className={`flex items-center space-x-1 ${allRead ? 'text-blue-200' : 'text-gray-300'}`}>
              <span>✓</span>
              <span className="-ml-3">✓</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Media Modal */}
      <MediaModal
        isOpen={mediaModal.isOpen}
        onClose={closeMediaModal}
        src={mediaModal.src}
        type={mediaModal.type}
        fileName={mediaModal.fileName}
      />
    </>
  );
};