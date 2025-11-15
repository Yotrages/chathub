"use client";
import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { useCallManagement } from '@/hooks/useCallManager';
import { CallInterface } from '@/components/chat/CallInterface';
import { IncomingCallModal } from '@/components/chat/IncomingCallModal';
import MobileDebugPanel from '@/components/chat/MobileDebugPanel';

type CallManagementType = ReturnType<typeof useCallManagement>;

const CallContext = createContext<CallManagementType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { chats, activeChat } = useSelector((state: RootState) => state.chat);
  
  const [globalCallChatId, setGlobalCallChatId] = React.useState<string | null>(activeChat);
  
  const currentCallChat = chats.find((chat) => chat._id === globalCallChatId);
  
  const callManagement = useCallManagement(currentCallChat);

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
    remoteAudioRef,
    localStream,
    remoteStream,
    peerConnectionRef,
    incomingCall,
    startCall: originalStartCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudioMute,
    toggleVideoMute,
    toggleRemoteAudio,
    switchCallType,
    setIsCallMinimized,
    formatDuration,
  } = callManagement;

  const startCall = React.useCallback((userId: string, isVideo: boolean) => {
    const chat = chats.find(c => 
      c.type !== 'group' && 
      c.participants?.some((p: any) => p._id === userId)
    );
    
    if (chat) {
      setGlobalCallChatId(chat._id);
      setTimeout(() => {
        originalStartCall(isVideo);
      }, 50);
    } else {
      console.error('No chat found with user:', userId);
    }
  }, [chats, originalStartCall]);

  React.useEffect(() => {
    if (incomingCall) {
      const chat = chats.find(c => 
        c.type !== 'group' && 
        c.participants?.some((p: any) => p._id === incomingCall.from)
      );
      if (chat) {
        setGlobalCallChatId(chat._id);
      }
    }
  }, [incomingCall, chats]);

  React.useEffect(() => {
    if (callState === 'idle') {
      setGlobalCallChatId(activeChat);
    }
  }, [callState, activeChat]);

  const contextValue = React.useMemo(() => ({
    ...callManagement,
    // startCall, 
    isInCall: callState !== 'idle',
  }), [callManagement, startCall, callState]);

  return (
    <CallContext.Provider value={contextValue}>
      {children}

      <IncomingCallModal
        incomingCall={incomingCall}
        callState={callState}
        currentChat={currentCallChat}
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
        remoteAudioRef={remoteAudioRef}
        currentChat={currentCallChat}
        onToggleAudioMute={toggleAudioMute}
        onToggleVideoMute={toggleVideoMute}
        onToggleRemoteAudio={toggleRemoteAudio}
        onSwitchCallType={switchCallType}
        onEndCall={endCall}
        onToggleMinimize={() => setIsCallMinimized(!isCallMinimized)}
        formatDuration={formatDuration}
      />
      {/* {callState !== 'idle' && (
      <MobileDebugPanel
                localStream={localStream}
                remoteStream={remoteStream}
                peerConnection={peerConnectionRef.current}
                callState={callState}
              />
      )} */}
    </CallContext.Provider>
  );
};