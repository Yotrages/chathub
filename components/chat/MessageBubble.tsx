// File: src/frontend/components/chat/MessageBubble.tsx
'use client';
import { useState } from 'react';
import { Download, Eye, Edit, Trash2, Smile } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/hooks/useChat';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

export const MessageBubble = ({ message, isOwn, showAvatar }: MessageBubbleProps) => {
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const { editMessage, deleteMessage, addReaction, removeReaction } = useChat();

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    if (isEditing && editedContent.trim()) {
      editMessage(message.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleReaction = (emoji: string) => {
    if (message.reactions?.some(r => r.userId === message.senderId && r.emoji === emoji)) {
      removeReaction(message.id);
    } else {
      addReaction(message.id, emoji);
    }
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
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
            ) : (
              <div className="bg-gray-200 p-4 rounded-lg max-w-xs">
                <Eye className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-600 text-center">Image unavailable</p>
              </div>
            )}
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <Download className="text-white" size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileName}</p>
                <p className="text-xs text-gray-500">Click to download</p>
              </div>
            </div>
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
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
              className="flex-1 px-2 py-1 border rounded"
            />
            <button
              onClick={handleEdit}
              className="p-1 bg-blue-500 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 bg-gray-300 text-white rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        );
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}>
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
            <span className="text-white text-xs font-semibold">U</span>
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-white text-gray-900 rounded-bl-md'
          } shadow-sm relative`}
        >
          {renderMessageContent()}
          <div className="flex items-center justify-between mt-1">
            <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTime(message.timestamp)}
              {message.edited && ' (Edited)'}
              {message.isRead && isOwn && <span className="ml-1">✓✓</span>}
            </p>
            {isOwn && message.messageType === 'text' && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-300 hover:text-white"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deleteMessage(message.id)}
                  className="p-1 text-gray-300 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex space-x-2 mt-1">
              {message.reactions.map((reaction, index) => (
                <span key={index} className="text-sm">{reaction.emoji}</span>
              ))}
            </div>
          )}
          <button
            onClick={() => handleReaction('👍')}
            className="text-sm p-1 hover:bg-gray-200 rounded"
          >
            <Smile size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};