'use client';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { UserDiscovery } from '@/components/chat/UserDiscovery';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { ChatProfile } from '@/components/chat/ChatProfile';
import { RootState } from '@/libs/redux/store';
import { useState } from 'react';
import { useSelector } from 'react-redux';

export default function ChatPage() {
  const [showUserDiscovery, setShowUserDiscovery] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { activeChat } = useSelector((state: RootState) => state.chat);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl">
        <ChatSidebar />
      </div>
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatWindow onShowProfile={() => setShowProfile(true)} />
        ) : (
          <WelcomeScreen onDiscoverUsers={() => setShowUserDiscovery(true)} />
        )}
      </div>
      {showUserDiscovery && <UserDiscovery onClose={() => setShowUserDiscovery(false)} />}
      {showProfile && <ChatProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
}