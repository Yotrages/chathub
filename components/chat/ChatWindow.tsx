'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { ChatHeader } from './ChatHeader';
import { CallInterface } from './CallInterface';
import { MessagesArea } from './MessageArea';
import { FileUpload } from './FileUpload';
import { MessageInput } from './MessageInput';
import { IncomingCallModal } from './IncomingCallModal';
import { useCallManagement } from '@/hooks/useCallManager';
import { useMessageManagement } from '@/hooks/useMessageManager';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface ChatWindowProps {
  onShowProfile: () => void;
}

export const ChatWindow = ({ onShowProfile }: ChatWindowProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);

  const { activeChat, chats } = useSelector((state: RootState) => state.chat);
  const currentChat = chats.find((chat) => chat._id === activeChat);

  const { isUserOnline } = useOnlineStatus();
  
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
    localVideoRef,
    remoteVideoRef,
    incomingCall,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudioMute,
    toggleVideoMute,
    toggleRemoteAudio,
    switchCallType,
    setIsCallMinimized,
    formatDuration
  } = useCallManagement(currentChat);

  const {
    isLoading,
    typingUsers,
    userStatuses
  } = useMessageManagement(currentChat);

  if (!currentChat) return null;

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        currentChat={currentChat}
        isUserOnline={isUserOnline}
        typingUsers={typingUsers}
        userStatuses={userStatuses}
        callState={callState}
        onShowProfile={onShowProfile}
        onStartCall={startCall}
      />

      <IncomingCallModal
        incomingCall={incomingCall}
        callState={callState}
        currentChat={currentChat}
        onAccept={acceptCall}
        onDecline={declineCall}
      />

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
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        currentChat={currentChat}
        onToggleAudioMute={toggleAudioMute}
        onToggleVideoMute={toggleVideoMute}
        onToggleRemoteAudio={toggleRemoteAudio}
        onSwitchCallType={switchCallType}
        onEndCall={endCall}
        onToggleMinimize={() => setIsCallMinimized(!isCallMinimized)}
        formatDuration={formatDuration}
      />

      <MessagesArea
        currentChat={currentChat}
        isUserOnline={isUserOnline}
        isLoading={isLoading}
      />

      <MessageInput
        currentChat={currentChat}
        onShowFileUpload={() => setShowFileUpload(true)}
      />

      {showFileUpload && (
        <FileUpload
          onUpload={() => {}}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
};