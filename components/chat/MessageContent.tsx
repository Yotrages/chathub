'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, Eye, Image, File, Mic, Video, Share2, Play, Pause } from 'lucide-react';
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

export const MessageContent = ({ message, isOwn, onClose, isEditing, otherParticipantsCount }: MessageContentProps) => {
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
      <div className={`p-3 mb-3 rounded-xl border-l-4 transition-all duration-200 ${
        isOwn 
          ? 'bg-blue-400/30 border-blue-200 backdrop-blur-sm' 
          : 'bg-gray-50 border-blue-500 shadow-sm'
      }`}>
        <p className={`text-xs font-semibold mb-1 ${
          isOwn ? 'text-blue-100' : 'text-blue-600'
        }`}>
          {replySender.username}
        </p>
        
        {message.replyTo.messageType === 'image' && (
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${isOwn ? 'bg-blue-300' : 'bg-blue-100'}`}>
              <Image size={14} className={isOwn ? 'text-blue-700' : 'text-blue-600'} />
            </div>
            <p className={`text-xs truncate ${
              isOwn ? 'text-blue-100' : 'text-gray-600'
            }`}>
              {message.replyTo.content || 'Photo'}
            </p>
          </div>
        )}
        
        {message.replyTo.messageType === 'video' && (
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${isOwn ? 'bg-blue-300' : 'bg-blue-100'}`}>
              <Video size={14} className={isOwn ? 'text-blue-700' : 'text-blue-600'} />
            </div>
            <p className={`text-xs truncate ${
              isOwn ? 'text-blue-100' : 'text-gray-600'
            }`}>
              {message.replyTo.content || 'Video'}
            </p>
          </div>
        )}
        
        {message.replyTo.messageType === 'audio' && (
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${isOwn ? 'bg-blue-300' : 'bg-blue-100'}`}>
              <Mic size={14} className={isOwn ? 'text-blue-700' : 'text-blue-600'} />
            </div>
            <p className={`text-xs truncate ${
              isOwn ? 'text-blue-100' : 'text-gray-600'
            }`}>
              {message.replyTo.content || 'Voice message'}
            </p>
          </div>
        )}
        
        {message.replyTo.messageType === 'file' && (
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${isOwn ? 'bg-blue-300' : 'bg-blue-100'}`}>
              <File size={14} className={isOwn ? 'text-blue-700' : 'text-blue-600'} />
            </div>
            <p className={`text-xs truncate ${
              isOwn ? 'text-blue-100' : 'text-gray-600'
            }`}>
              {message.replyTo.fileName || 'Document'}
            </p>
          </div>
        )}
        
        {message.replyTo.messageType === 'post' && (
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${isOwn ? 'bg-blue-300' : 'bg-blue-100'}`}>
              <Share2 size={14} className={isOwn ? 'text-blue-700' : 'text-blue-600'} />
            </div>
            <p className={`text-xs truncate ${
              isOwn ? 'text-blue-100' : 'text-gray-600'
            }`}>
              {message.replyTo.content || 'Shared Post'}
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
          <div className="relative">
            {!imageError ? (
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={message.fileUrl}
                  alt="Shared image"
                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-95 transition-all duration-300 shadow-md"
                  onError={() => setImageError(true)}
                  onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                  aria-label="View image in new tab"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-lg max-w-xs border-2 border-dashed border-gray-300">
                <Eye className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600 text-center font-medium">Image unavailable</p>
              </div>
            )}
            {message.content && (
              <p className={`mt-3 text-sm leading-relaxed ${
                isOwn ? 'text-blue-50' : 'text-gray-700'
              }`}>
                {message.content}
              </p>
            )}
          </div>
        );
        
      case 'audio':
        return (
          <div className="min-w-[250px] max-w-xs">
            {!mediaError ? (
              <div className={`p-4 rounded-2xl shadow-inner transition-all duration-300 ${
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
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleAudioPlay}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                      isOwn
                        ? 'bg-white text-blue-500 hover:bg-blue-50'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                 
                  <div className="flex-1">
                    {/* Waveform-style progress bar */}
                    <div
                      ref={waveformRef}
                      className={`h-8 rounded-full cursor-pointer relative overflow-hidden ${
                        isOwn ? 'bg-blue-300/50' : 'bg-gray-200'
                      }`}
                      onClick={handleSeek}
                    >
                      {/* Waveform bars */}
                      <div className="absolute inset-0 flex items-center justify-center space-x-0.5 px-2">
                        {Array.from({ length: 40 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-0.5 rounded-full transition-all duration-200 ${
                              i < (currentTime / duration * 40) 
                                ? (isOwn ? 'bg-white' : 'bg-blue-500') 
                                : (isOwn ? 'bg-blue-200' : 'bg-gray-400')
                            }`}
                            style={{
                              height: `${Math.max(8, Math.random() * 24)}px`
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
                    <div className={`flex justify-between text-xs mt-2 font-medium ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-2xl border-2 border-dashed border-gray-300">
                <Mic className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600 text-center font-medium">Audio unavailable</p>
              </div>
            )}
            {message.content && (
              <p className={`mt-3 text-sm leading-relaxed ${
                isOwn ? 'text-blue-50' : 'text-gray-700'
              }`}>
                {message.content}
              </p>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="max-w-xs">
            {!mediaError ? (
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <video
                  src={message.fileUrl}
                  controls
                  className="w-full h-48 object-cover rounded-lg"
                  onError={() => setMediaError(true)}
                  aria-label="Play video message"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none rounded-lg" />
              </div>
            ) : (
              <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300">
                <Video className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600 text-center font-medium">Video unavailable</p>
              </div>
            )}
            {message.content && (
              <p className={`mt-3 text-sm leading-relaxed ${
                isOwn ? 'text-blue-50' : 'text-gray-700'
              }`}>
                {message.content}
              </p>
            )}
          </div>
        );
        
      case 'file':
        return (
          <div className={`p-4 rounded-xl max-w-xs transition-all duration-300 hover:shadow-md ${
            isOwn ? 'bg-blue-400/40' : 'bg-gray-50 border border-gray-200'
          }`}>
            <a
              href={message.fileUrl}
              download={message.fileName}
              className="flex items-center space-x-3 group"
              aria-label={`Download file ${message.fileName || 'File'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                isOwn ? 'bg-white/90 text-blue-600' : 'bg-blue-500 text-white'
              }`}>
                <Download size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  isOwn ? 'text-white' : 'text-gray-800'
                }`}>
                  {message.fileName || 'Document'}
                </p>
                <p className={`text-xs mt-1 ${
                  isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  Tap to download
                </p>
              </div>
            </a>
            {message.content && (
              <p className={`mt-3 text-sm leading-relaxed ${
                isOwn ? 'text-blue-50' : 'text-gray-700'
              }`}>
                {message.content}
              </p>
            )}
          </div>
        );
        
      case 'post':
        return (
          <div className={`rounded-xl overflow-hidden max-w-xs border transition-all duration-300 hover:shadow-lg ${
            isOwn 
              ? 'bg-blue-400/40 border-blue-300/50' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            {postPreview ? (
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  {postPreview.images?.[0] && (
                    <img
                      src={postPreview.images[0]}
                      alt="Post preview"
                      className="w-16 h-16 rounded-lg object-cover shadow-sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold mb-2 ${
                      isOwn ? 'text-blue-100' : 'text-blue-600'
                    }`}>
                      {postPreview.authorId.username}
                    </p>
                    <p className={`text-sm line-clamp-3 leading-relaxed ${
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
              <div className="p-4">
                <p className={`text-sm leading-relaxed ${
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
          <div className="flex items-center space-x-2 min-w-[200px]">
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 text-gray-800 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
              aria-label="Edit message"
            />
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm"
              aria-label="Save edited message"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-sm"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
            isOwn ? 'text-white' : 'text-gray-800'
          }`}>
            {message.content}
          </p>
        );
    }
  };

  return (
    <div>
      {renderReplyPreview()}
      {renderMessageContent()}
      <div className={`flex items-center justify-between mt-3 text-xs ${
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
          <span className="-ml-2">✓</span>
        </div>
      )}
      </div>
    </div>
  );
};