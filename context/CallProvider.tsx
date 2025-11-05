"use client";
import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { useCallManagement } from '@/hooks/useCallManager';
import { CallInterface } from '@/components/chat/CallInterface';
import { IncomingCallModal } from '@/components/chat/IncomingCallModal';
import MobileDebugPanel from '@/components/chat/MobileDebugPanel';

// Export the return type from your hook
type CallManagementType = ReturnType<typeof useCallManagement>;

const CallContext = createContext<CallManagementType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { chats, activeChat } = useSelector((state: RootState) => state.chat);
  
  // Use a global "current chat" for calls (can be null initially)
  // When a call comes in, we'll find the chat based on the caller's ID
  const [globalCallChatId, setGlobalCallChatId] = React.useState<string | null>(activeChat);
  
  // Get the chat object for the current call
  const currentCallChat = chats.find((chat) => chat._id === globalCallChatId);
  
  // Use your existing useCallManagement hook with ALL its functionality
  const callManagement = useCallManagement(currentCallChat);

  // Extract what we need from the hook
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

  // Wrapper for startCall that sets the global chat context
  const startCall = React.useCallback((userId: string, isVideo: boolean) => {
    const chat = chats.find(c => 
      c.type !== 'group' && 
      c.participants?.some((p: any) => p._id === userId)
    );
    
    if (chat) {
      setGlobalCallChatId(chat._id);
      // Give a small delay for state to update
      setTimeout(() => {
        originalStartCall(isVideo);
      }, 50);
    } else {
      console.error('No chat found with user:', userId);
    }
  }, [chats, originalStartCall]);

  // When incoming call arrives, set the global chat context
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

  // Reset global chat when call ends
  React.useEffect(() => {
    if (callState === 'idle') {
      // Reset to active chat after call ends
      setGlobalCallChatId(activeChat);
    }
  }, [callState, activeChat]);

  // Create the context value with all functions from your hook
  const contextValue = React.useMemo(() => ({
    ...callManagement,
    // startCall, // Use our wrapped version
    isInCall: callState !== 'idle',
  }), [callManagement, startCall, callState]);

  return (
    <CallContext.Provider value={contextValue}>
      {children}
      
      {/* <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline 
        style={{ display: 'none' }} 
      /> */}

      {/* Incoming Call Modal - Shows on any page */}
      <IncomingCallModal
        incomingCall={incomingCall}
        callState={callState}
        currentChat={currentCallChat}
        onAccept={acceptCall}
        onDecline={declineCall}
      />

      {/* Call Interface - Shows on any page */}
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
              <MobileDebugPanel
                localStream={localStream}
                remoteStream={remoteStream}
                peerConnection={peerConnectionRef.current}
                callState={callState}
              />
    </CallContext.Provider>
  );
};