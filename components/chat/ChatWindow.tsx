'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/context/socketContext';
import { MessageInput } from './MessageInput';
import { FileUpload } from './FileUpload';
import { ChatHeader } from './ChatHeader';
import { IncomingCallModal } from './IncomingCallModal';
import { CallInterface } from './CallInterface';
import { MessagesArea } from './MessageArea';
import { useCallManager } from '@/hooks/useCallManager';
import { useMessageManager } from '@/hooks/useMessageManager';
import { useUserStatus } from '@/hooks/useUserStatus';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  onShowProfile: () => void;
}

export const ChatWindow = ({ onShowProfile }: ChatWindowProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isUserOnline, setIsUserOnline] = useState(navigator.onLine);

  const { socket } = useSocket();
  const { activeChat, chats, messages } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const { joinChat } = useChat();

  const currentChat = chats.find((chat) => chat._id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];
  const littlePhone = screen.availWidth < 300;

  // Custom hooks
  const { userStatuses } = useUserStatus(currentChat, user, isUserOnline);
  const { loadedChats, isLoading, loadChatMessages, markNewMessagesAsRead, clearChatTracking } = useMessageManager(user, isUserOnline);
  
  const {
    callState,
    connectionState,
    isVideoCall,
    callError,
    callDuration,
    isAudioMuted,
    isVideoMuted,
    isRemoteAudioMuted,
    isCallMinimized,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    formatDuration,
    startCall,
    endCall,
    acceptCall,
    declineCall,
    toggleAudioMute,
    toggleVideoMute,
    toggleRemoteAudio,
    setIsCallMinimized,
    setIncomingCall,
    setCallState,
    setCallTimeout,
    // initializePeerConnection
  } = useCallManager(currentChat, user, userStatuses);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsUserOnline(true);
      if (socket) {
        socket.emit('user_online');
      }
    };

    const handleOffline = () => {
      setIsUserOnline(false);
      if (socket) {
        socket.emit('user_offline');
      }
      if (callState !== 'idle') {
        endCall();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket, callState, endCall]);

  // Handle activeChat changes
  useEffect(() => {
    if (!activeChat || !isUserOnline) return;

    joinChat(activeChat);

    if (!loadedChats.has(activeChat)) {
      loadChatMessages(activeChat);
    }
  }, [activeChat, joinChat, loadChatMessages, isUserOnline, loadedChats]);

  // Mark new messages as read
  useEffect(() => {
    if (activeChat && isUserOnline && chatMessages.length > 0) {
      markNewMessagesAsRead(activeChat, chatMessages);
    }
  }, [chatMessages, activeChat, markNewMessagesAsRead, isUserOnline]);

  // Clear tracking when switching chats
  useEffect(() => {
    clearChatTracking();
  }, [activeChat, clearChatTracking]);

  // Handle typing indicators
  useEffect(() => {
    if (!socket || !activeChat || !isUserOnline) return;

    const handleTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat && data.userId !== user?._id) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    };

    const handleStopTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, activeChat, user?._id, isUserOnline]);

  // Enhanced call signaling
  useEffect(() => {
    if (!socket || !activeChat || !isUserOnline || !currentChat) return;

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit; from: string; isVideo: boolean }) => {
      // Call signaling logic would be handled by the call manager hook
      // This is moved to the useCallManager hook
    };

    const handleCallRequest = (data: { from: string; isVideo: boolean; timestamp: string }) => {
      if (data.from === currentChat._id && callState === 'idle') {
        setIncomingCall({ from: data.from, isVideo: data.isVideo });
        setCallState('ringing');

        const timeout = setTimeout(() => {
          declineCall();
        }, 30000);
        setCallTimeout(timeout);
      }
    };

    const handleCallEnd = (data: { from: string; timestamp: string }) => {
      if (data.from === currentChat._id) {
        endCall();
        toast.custom('Call ended by other user');
      }
    };

    const handleCallDecline = (data: { from: string; timestamp: string }) => {
      if (data.from === currentChat._id) {
        endCall();
        toast.error('Call declined');
      }
    };

    socket.on('call_request', handleCallRequest);
    socket.on('call_end', handleCallEnd);
    socket.on('call_decline', handleCallDecline);

    return () => {
      socket.off('call_request', handleCallRequest);
      socket.off('call_end', handleCallEnd);
      socket.off('call_decline', handleCallDecline);
    };
  }, [socket, activeChat, isUserOnline, currentChat, callState]);

  if (!currentChat) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatHeader
        currentChat={currentChat}
        user={user}
        isUserOnline={isUserOnline}
        typingUsers={typingUsers}
        userStatuses={userStatuses}
        callState={callState}
        onStartCall={startCall}
        onShowProfile={onShowProfile}
        littlePhone={littlePhone}
      />

      {/* Incoming Call Modal */}
      {incomingCall && callState === 'ringing' && (
        <IncomingCallModal
          incomingCall={incomingCall}
          currentChat={currentChat}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {/* Call Interface */}
      {callState !== 'idle' && !incomingCall && (
        <CallInterface
          callState={callState}
          connectionState={connectionState}
          isVideoCall={isVideoCall}
          callError={callError}
          callDuration={callDuration}
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          isRemoteAudioMuted={isRemoteAudioMuted}
          isCallMinimized={isCallMinimized}
          currentChat={currentChat}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          formatDuration={formatDuration}
          onToggleAudioMute={toggleAudioMute}
          onToggleVideoMute={toggleVideoMute}
          onToggleRemoteAudio={toggleRemoteAudio}
          onEndCall={endCall}
          onToggleMinimize={() => setIsCallMinimized(!isCallMinimized)}
        />
      )}

      {/* Messages Area */}
      <MessagesArea
        isUserOnline={isUserOnline}
        isLoading={isLoading}
        chatMessages={chatMessages}
        currentChat={currentChat}
        user={user}
      />

      {/* Message Input */}
      <MessageInput
        currentChat={currentChat}
        onShowFileUpload={() => setShowFileUpload(true)}
      />

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onUpload={() => {
            // This will be handled in MessageInput
          }}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
};