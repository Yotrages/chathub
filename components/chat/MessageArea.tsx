import { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { ReactionsModal } from '../post/LikesModal';
import { MediaModal } from './MediaModal'; 

interface LikesModalState {
  isOpen: boolean;
  reactions: Message['reactions'];
  type: string;
}

const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isNewDate = (current: Date, previous: Date | null): boolean => {
  if (!previous) return true;
  return current.toDateString() !== previous.toDateString();
};

interface MessagesAreaProps {
  currentChat: any;
  isUserOnline: boolean;
  isLoading: boolean;
}

export const MessagesArea = ({
  currentChat,
  isUserOnline,
  isLoading,
}: MessagesAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const lastMessageCountRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  
  const { activeChat, messages } = useSelector((state: RootState) => state.chat);
  const [likesModal, setLikesModal] = useState<LikesModalState>({ 
    isOpen: false, 
    reactions: [], 
    type: 'reply' 
  });
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    src: string;
    type: 'image' | 'video';
    fileName?: string;
  }>({
    isOpen: false,
    src: '',
    type: 'image',
    fileName: ''
  });
  const { user } = useSelector((state: RootState) => state.auth);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      const { scrollHeight, scrollTop, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isNearBottom = distanceFromBottom < 150;
      
      isUserScrollingRef.current = !isNearBottom;

      scrollTimeoutRef.current = setTimeout(() => {
        if (isNearBottom) {
          isUserScrollingRef.current = false;
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const messageCount = chatMessages.length;
    
    if (lastMessageCountRef.current === 0 && messageCount > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'auto',
          block: 'end',
          inline: 'nearest'
        });
      }, 100);
      lastMessageCountRef.current = messageCount;
      return;
    }

    if (messageCount > lastMessageCountRef.current) {
      if (!isUserScrollingRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
        }, 100);
      } else {
        console.log('New message arrived, but user is reading history');
      }
      lastMessageCountRef.current = messageCount;
    }
  }, [chatMessages.length]);

  useEffect(() => {
    lastMessageCountRef.current = 0;
    isUserScrollingRef.current = false;
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'auto',
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
  }, [activeChat]);

  const handleOpenLikesModal = (reactions: Message['reactions'], type: string = 'message') => {
    setLikesModal({ isOpen: true, reactions, type });
  };
  
  const handleCloseLikes = () => {
    setLikesModal({ isOpen: false, reactions: [], type: 'reply' });
  };

  const handleOpenMediaModal = (src: string, type: 'image' | 'video', fileName?: string) => {
    console.log('Opening media modal:', { src, type, fileName });
    setMediaModal({ isOpen: true, src, type, fileName });
  };

  const handleCloseMediaModal = () => {
    console.log('Closing media modal');
    setMediaModal({ isOpen: false, src: '', type: 'image', fileName: '' });
  };

  return (
    <>
      <div 
        ref={messagesContainerRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden py-4 px-0.5 xs:p-4 space-y-4 surface-secondary"
        style={{ scrollBehavior: 'smooth' }}
      >
        {!isUserOnline && (
          <div className="text-center w-full text-red-500 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm">You are currently offline. Messages will not load or send.</p>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading messages...</p>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">👋</div>
            <p>Start your conversation with {currentChat.name}</p>
            <p className="text-sm mt-1">Say hello and break the ice!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const currentDate = new Date(msg.createdAt);
            const previousMsg = index > 0 ? chatMessages[index - 1] : null;
            const previousDate = previousMsg ? new Date(previousMsg.createdAt) : null;
            const showDateSeparator = isNewDate(currentDate, previousDate);

            return (
              <div key={msg._id}>
                {showDateSeparator && (
                  <div className="sticky top-0 z-10 text-center py-2">
                    <span className="inline-block bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-0.5 rounded-full shadow-sm">
                      {formatDate(currentDate)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isOwn={
                    typeof msg.senderId === 'string'
                      ? msg.senderId === user?._id
                      : msg.senderId._id === user?._id
                  }
                  showAvatar={
                    index === 0 ||
                    (typeof chatMessages[index - 1].senderId === 'string'
                      ? chatMessages[index - 1].senderId !==
                        (typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id)
                      : chatMessages[index - 1].senderId !==
                        (typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id))
                  }
                  otherParticipantsCount={currentChat?.participants?.length - 1 || 0}
                  onOpenLikesModal={handleOpenLikesModal}
                  onOpenMediaModal={handleOpenMediaModal}
                />
              </div>
            );
          })
        )}
        {/* 🔥 CHANGED: Scroll anchor at the end */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
      
      <ReactionsModal
        isOpen={likesModal.isOpen}
        onClose={handleCloseLikes}
        type={likesModal.type}
        reactions={likesModal.reactions}
      />
      
      <MediaModal
        isOpen={mediaModal.isOpen}
        onClose={handleCloseMediaModal}
        src={mediaModal.src}
        type={mediaModal.type}
        fileName={mediaModal.fileName}
      />
    </>
  );
};