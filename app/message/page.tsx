'use client';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatProfile } from '@/components/chat/ChatProfile';
import { useState } from 'react';

export default function Page() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full max-w-full overflow-hidden">
      <div className="flex h-screen flex-col">
          <ChatWindow onShowProfile={() => setShowProfile(true)} />
      </div>
      {showProfile && <ChatProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
}