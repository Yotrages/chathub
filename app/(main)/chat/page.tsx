'use client';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { UserDiscovery } from '@/components/chat/UserDiscovery';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { ChatProfile } from '@/components/chat/ChatProfile';
import { RootState } from '@/libs/redux/store';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

export default function ChatPage() {
  const [showUserDiscovery, setShowUserDiscovery] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { activeChat } = useSelector((state: RootState) => state.chat);
  
  const [chatHeight, setChatHeight] = useState('100vh');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateHeight = () => {
      const header = document.querySelector('header');
      
      if (!header || !containerRef.current) {
        setChatHeight('100vh');
        return;
      }

      const headerStyle = window.getComputedStyle(header);
      const isHeaderVisible = headerStyle.display !== 'none' && 
                             headerStyle.visibility !== 'hidden' &&
                             header.offsetHeight > 0;

      if (!isHeaderVisible) {
        setChatHeight('100vh');
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const availableHeight = window.innerHeight - rect.top;
      setChatHeight(`${availableHeight}px`);
    };

    const timer = setTimeout(calculateHeight, 50);

    window.addEventListener('resize', calculateHeight);
    
    const resizeObserver = new ResizeObserver(calculateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const header = document.querySelector('header');
    if (header) {
      resizeObserver.observe(header);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-700 overflow-hidden"
      style={{ height: chatHeight }}
    >
      {/* Sidebar - Never scrolls */}
      <div className="w-full min-h-screen flex-shrink-0 sm:w-80 bg-white/80 dark:bg-gray-900/15 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl overflow-hidden">
        <ChatSidebar />
      </div>

      {/* Chat Window - Isolated scroll */}
      <div className="flex-1 hidden sm:flex flex-col overflow-hidden min-w-0">
        {activeChat ? (
          <ChatWindow onShowProfile={() => setShowProfile(true)} />
        ) : (
          <WelcomeScreen onDiscoverUsers={() => setShowUserDiscovery(true)} />
        )}
      </div>

      {/* Modals */}
      {showUserDiscovery && <UserDiscovery onClose={() => setShowUserDiscovery(false)} />}
      {showProfile && <ChatProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
}