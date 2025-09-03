'use client';
import { useState, useEffect } from 'react';
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
}

interface PostPreview {
  _id: string;
  content: string;
  authorId: { username: string; avatar?: string };
  images?: string[];
}

export const MessageContent = ({ message, isOwn, onClose, isEditing }: MessageContentProps) => {
  const [imageError, setImageError] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [postPreview, setPostPreview] = useState<PostPreview | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
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
    if (audioRef) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      audioRef.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;

    const replySender = typeof message.replyTo.senderId === 'string'
      ? { username: 'Unknown' }
      : message.replyTo.senderId;

    return (
      <div className="bg-gray-100 p-2 rounded-lg mb-2 border-l-4 border-blue-500">
        <p className="text-xs font-medium text-gray-700">{replySender.username}</p>
        {message.replyTo.messageType === 'image' && (
          <div className="flex items-center space-x-2">
            <Image size={16} className="text-gray-500" />
            <p className="text-xs text-gray-500 line-clamp-2">
              {message.replyTo.content || 'Image'}
            </p>
          </div>
        )}
        {message.replyTo.messageType === 'video' && (
          <div className="flex items-center space-x-2">
            <Video size={16} className="text-gray-500" />
            <p className="text-xs text-gray-500 line-clamp-2">
              {message.replyTo.content || 'Video'}
            </p>
          </div>
        )}
        {message.replyTo.messageType === 'audio' && (
          <div className="flex items-center space-x-2">
            <Mic size={16} className="text-gray-500" />
            <p className="text-xs text-gray-500 line-clamp-2">
              {message.replyTo.content || 'Audio'}
            </p>
          </div>
        )}
        {message.replyTo.messageType === 'file' && (
          <div className="flex items-center space-x-2">
            <File size={16} className="text-gray-500" />
            <p className="text-xs text-gray-500 line-clamp-2">
              {message.replyTo.fileName || 'File'}
            </p>
          </div>
        )}
        {message.replyTo.messageType === 'post' && (
          <div className="flex items-center space-x-2">
            <Share2 size={16} className="text-gray-500" />
            <p className="text-xs text-gray-500 line-clamp-2">
              {message.replyTo.content || 'Shared Post'}
            </p>
          </div>
        )}
        {message.replyTo.messageType === 'text' && (
          <p className="text-xs text-gray-500 line-clamp-2">{message.replyTo.content}</p>
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
              <img
                src={message.fileUrl}
                alt="Shared image"
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onError={() => setImageError(true)}
                onClick={() => message.fileUrl && window.open(message.fileUrl, '_blank')}
                aria-label="View image in new tab"
              />
            ) : (
              <div className="bg-gray-200 p-4 rounded-lg max-w-xs">
                <Eye className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-600 text-center">Image unavailable</p>
              </div>
            )}
            {message.content && <p className="mt-2 text-sm">{message.content}</p>}
          </div>
        );
      case 'audio':
        return (
          <div className="max-w-xs">
            {!mediaError ? (
              <div className={`p-3 rounded-lg ${isOwn ? 'bg-blue-400' : 'bg-white'} shadow-sm`}>
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
                
                {/* Custom Audio Player UI */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAudioPlay}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isOwn 
                        ? 'bg-white text-blue-500 hover:bg-gray-100' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  
                  <div className="flex-1">
                    {/* Progress bar */}
                    <div 
                      className={`h-2 rounded-full cursor-pointer ${
                        isOwn ? 'bg-blue-300' : 'bg-gray-200'
                      }`}
                      onClick={handleSeek}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOwn ? 'bg-white' : 'bg-blue-500'
                        }`}
                        style={{
                          width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                        }}
                      />
                    </div>
                    
                    {/* Time display */}
                    <div className={`flex justify-between text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-200 p-4 rounded-lg">
                <Mic className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-600 text-center">Audio unavailable</p>
              </div>
            )}
            {message.content && <p className="mt-2 text-sm">{message.content}</p>}
          </div>
        );
      case 'video':
        return (
          <div className="max-w-xs">
            {!mediaError ? (
              <video
                src={message.fileUrl}
                controls
                className="w-full h-50 object-cover rounded-lg"
                onError={() => setMediaError(true)}
                aria-label="Play video message"
              />
            ) : (
              <div className="bg-gray-200 p-4 rounded-lg">
                <Video className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-600 text-center">Video unavailable</p>
              </div>
            )}
            {message.content && <p className="mt-2 text-sm">{message.content}</p>}
          </div>
        );
      case 'file':
        return (
          <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
            <a
              href={message.fileUrl}
              download={message.fileName}
              className="flex items-center space-x-2"
              aria-label={`Download file ${message.fileName || 'File'}`}
            >
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <Download className="text-white" size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileName || 'File'}</p>
                <p className="text-xs text-gray-500">Click to download</p>
              </div>
            </a>
            {message.content && <p className="mt-2 text-sm">{message.content}</p>}
          </div>
        );
      case 'post':
        return (
          <div className="bg-gray-100 max-w-[200px] xs:max-w-[280px] rounded-lg w-full overflow-hidden">
            {postPreview ? (
              <div className="flex items-start space-x-2">
                {postPreview.images?.[0] && (
                  <img
                    src={postPreview.images[0]}
                    alt="Post preview"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{postPreview.authorId.username}</p>
                  <p className="text-sm line-clamp-2">{postPreview.content}</p>
                  <Link
                    href={`/post/${message.postId}`}
                    className="text-blue-500 text-sm hover:underline"
                    aria-label="View shared post"
                  >
                    View Post
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-clip text-black">{message.content}</p>
                {message.postId ? (
                  <Link
                    href={`/post/${message.postId}`}
                    className="text-blue-500 text-sm hover:underline"
                    aria-label="View shared post"
                  >
                    View Post
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500">Post unavailable</p>
                )}
              </>
            )}
          </div>
        );
      default:
        return isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 text-black px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
              aria-label="Edit message"
            />
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              aria-label="Save edited message"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        );
    }
  };

  return (
    <div>
      {renderReplyPreview()}
      {renderMessageContent()}
      <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
        {formatTime(message.createdAt)}
        {message.edited && ' (edited)'}
        {message.isRead && isOwn && <span className="ml-1 text-blue-200">✓✓</span>}
      </p>
    </div>
  );
};