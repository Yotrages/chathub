'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { UserProfile } from './UserProfile';

export const ChatLayout = () => {
  const [showProfile, setShowProfile] = useState(false);
  const { activeChat } = useSelector((state: RootState) => state.chat);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <ChatSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatWindow onShowProfile={() => setShowProfile(true)} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Welcome to Chat
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Sidebar */}
      {showProfile && (
        <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
          <UserProfile onClose={() => setShowProfile(false)} />
        </div>
      )}
    </div>
  );
};