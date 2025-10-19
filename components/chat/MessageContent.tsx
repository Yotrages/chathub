'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, Eye, Image, File, Mic, Video, Play, Pause } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types';
import Link from 'next/link';
import { api } from '@/libs/axios/config';
import { toast } from 'react-hot-toast';
import  CallMessage  from './CallMessage';

interface MessageContentProps {
  message: Message;
  isOwn: boolean;
  onClose: () => void;
  isEditing: boolean;
  otherParticipantsCount: number;
  onOpenMediaModal?: (src: string, type: 'image' | 'video', fileName?: string) => void;
}

interface PostPreview {
  _id: string;
  content: string;
  authorId: { username: string; avatar?: string };
  images?: string[];
}

export const MessageContent = ({ 
  message, 
  isOwn, 
  onClose, 
  isEditing, 
  otherParticipantsCount,
  onOpenMediaModal 
}: MessageContentProps) => {
  const [imageError, setImageError] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [postPreview, setPostPreview] = useState<PostPreview | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
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
    
    switch (message.messageType) {
      case 'image':
        return (
          <div className="relative w-full">
            {!imageError ? (
              <div onClick={() => {
                    console.log('Image clicked:', message.fileUrl);
                    onOpenMediaModal?.(message.fileUrl!, 'image', message.fileName);
                  }} className="relative overflow-hidden rounded-lg w-full">
                <img
                  src={message.fileUrl}
                  alt="Shared image"
                  className="w-full max-w-full h-auto max-h-48 sm:max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-all duration-300 shadow-md"
                  onError={() => setImageError(true)}
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
                {imageError && message.content && (
                  <p className={`mt-2 sm:mt-3 text-sm leading-relaxed break-words ${
                    isOwn ? 'text-blue-50' : 'text-gray-700'
                  }`}>
                    {message.content}
                  </p>
                )}
              </div>
            )}
          </div>
        );
        
      case 'audio':
        return (
          <div className="w-full min-w-[240px]">
            {!mediaError ? (
              <div className={`p-3 sm:p-4 w-full rounded-xl sm:rounded-2xl shadow-inner transition-all duration-300 ${
                isOwn 
                  ? 'bg-blue-400/40 backdrop-blur-sm' 
                  : 'bg-white shadow-md border border-gray-100'
              }`}>
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
               
                <div className="flex items-center space-x-3 sm:space-x-4 w-full">
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
                    <div
                      ref={waveformRef}
                      className={`h-6 sm:h-8 rounded-full cursor-pointer relative overflow-hidden ${
                        isOwn ? 'bg-blue-300/50' : 'bg-gray-200'
                      }`}
                      onClick={handleSeek}
                    >
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
                      
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${
                          isOwn ? 'bg-white/30' : 'bg-blue-500/30'
                        }`}
                        style={{
                          width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                        }}
                      />
                    </div>
                   
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
              <div className='pr-2'>
                <div className="bg-gray-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300">
                  <Mic className="mx-auto mb-2 text-gray-400" size={24} />
                  <p className="text-sm text-gray-600 text-center font-medium">Audio unavailable</p>
                </div>
              </div>
            )}
            {mediaError && message.content && (
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
                  onClick={() => onOpenMediaModal?.(message.fileUrl!, 'video', message.fileName)}
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
            {mediaError && message.content && (
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
          <>
          <CallMessage message={message} isOwnMessage={isOwn}/>;
          </>
        );
        
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
    <div className="w-full">
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
        {isOwn && message.readBy.length >= 1 && (
          <div className={`flex items-center space-x-1 ${allRead ? 'text-green-200' : 'text-gray-300'}`}>
            <span>✓</span>
            <span className="-ml-3">✓</span>
          </div>
        )}
      </div>
    </div>
  );
};