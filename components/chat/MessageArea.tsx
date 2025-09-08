import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';

interface MessagesAreaProps {
  isUserOnline: boolean;
  isLoading: boolean;
  chatMessages: any[];
  currentChat: any;
  user: any;
}

export const MessagesArea: React.FC<MessagesAreaProps> = ({
  isUserOnline,
  isLoading,
  chatMessages,
  currentChat,
  user
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {!isUserOnline && (
        <div className="text-center text-red-500 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm">You are currently offline. Messages will not load or send.</p>
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
        chatMessages.map((msg, index) => (
          <MessageBubble
            key={msg._id}
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
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
