'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Phone, Video, Bell, BellOff, Trash2, UserMinus, Settings } from 'lucide-react';
import { RootState } from '@/libs/redux/store';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile = ({ onClose }: UserProfileProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { activeChat, chats } = useSelector((state: RootState) => state.chat);
  
  const currentChat = chats.find(chat => chat._id === activeChat);

  if (!currentChat) return null;

  const handleMuteToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // Implement mute/unmute logic
  };

  const handleDeleteChat = () => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      // Implement delete chat logic
      onClose();
    }
  };

  const handleLeaveGroup = () => {
    if (confirm('Are you sure you want to leave this group?')) {
      // Implement leave group logic
      onClose();
    }
  };

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Chat Info</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>
      </div>

      {/* Profile Section */}
      <div className="p-6 text-center border-b border-gray-200">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-semibold">
            {currentChat.name?.charAt(0) || 'U'}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-1">
          {currentChat.name || 'Unknown Chat'}
        </h3>
        <p className="text-gray-500">
          {currentChat.type === 'group' 
            ? `Group • ${currentChat.participants.length} members`
            : 'Online'
          }
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
            <Phone size={24} className="mb-2" />
            <span className="text-sm">Call</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
            <Video size={24} className="mb-2" />
            <span className="text-sm">Video</span>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {/* Notifications */}
          <button
            onClick={handleMuteToggle}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {notificationsEnabled ? (
                <Bell className="text-gray-500" size={20} />
              ) : (
                <BellOff className="text-gray-500" size={20} />
              )}
              <span className="text-gray-700">Notifications</span>
            </div>
            <div className={`w-12 h-6 rounded-full ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'} relative transition-colors`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </div>
          </button>

          {/* Settings */}
          <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
            <Settings className="text-gray-500" size={20} />
            <span className="text-gray-700">Chat Settings</span>
          </button>

          {/* Group Members (if group chat) */}
          {currentChat.type === 'group' && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Members ({currentChat.participants.length})
              </h4>
              {/* Render members list here */}
              <div className="space-y-2">
                {currentChat.participants.map((participantId, index) => (
                  <div key={participantId._id} className="flex items-center space-x-3 p-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-gray-700">User {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        {currentChat.type === 'group' ? (
          <button
            onClick={handleLeaveGroup}
            className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <UserMinus size={20} />
            <span>Leave Group</span>
          </button>
        ) : (
          <button
            onClick={handleDeleteChat}
            className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={20} />
            <span>Delete Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};
