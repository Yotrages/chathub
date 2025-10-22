'use client';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatProfile } from '@/components/chat/ChatProfile';
import { useState, useEffect } from 'react';

export default function Page() {
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Set CSS variable for actual viewport height
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set on mount
    setVH();

    // Update on resize and orientation change
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Cleanup
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  return (
    <div 
      className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 w-full max-w-full overflow-hidden"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <div className="flex flex-col" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        <ChatWindow onShowProfile={() => setShowProfile(true)} />
      </div>
      {showProfile && <ChatProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
}