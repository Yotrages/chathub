"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { ChatHeader } from "./ChatHeader";
import { CallInterface } from "./CallInterface";
import { MessagesArea } from "./MessageArea";
import { FileUpload } from "./FileUpload";
import { MessageInput } from "./MessageInput";
import { IncomingCallModal } from "./IncomingCallModal";
import { useCallManagement } from "@/hooks/useCallManager";
import { useMessageManagement } from "@/hooks/useMessageManager";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import MobileDebugPanel from "./MobileDebugPanel";

interface ChatWindowProps {
  onShowProfile: () => void;
}

export const ChatWindow = ({ onShowProfile }: ChatWindowProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);

  const { activeChat, chats } = useSelector((state: RootState) => state.chat);
  const currentChat = chats.find((chat) => chat._id === activeChat);

  const { isUserOnline: currentUserOnline } = useOnlineStatus();

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
    formatDuration,
    localStream,
    remoteStream,
    peerConnectionRef,
  } = useCallManagement(currentChat);

  const { isLoading, typingUsers, userStatuses } =
    useMessageManagement(currentChat);

  if (!currentChat) return null;

  return (
    <div className="flex w-full max-w-full flex-col h-full relative overflow-hidden">
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

      {callState !== "idle" && (
        <MobileDebugPanel
          localStream={localStream}
          remoteStream={remoteStream}
          peerConnection={peerConnectionRef.current}
          callState={callState}
        />
      )}

      {(callState === "idle" || isCallMinimized) && (
        <>
          <div className="flex-shrink-0 z-40">
            <ChatHeader
              currentChat={currentChat}
              typingUsers={typingUsers}
              userStatuses={userStatuses}
              callState={callState}
              onShowProfile={onShowProfile}
              onStartCall={startCall}
            />
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="h-full overflow-y-auto pb-16">
              <MessagesArea
                currentChat={currentChat}
                isUserOnline={currentUserOnline}
                isLoading={isLoading}
              />
            </div>
          </div>

          <MessageInput
            currentChat={currentChat}
            onShowFileUpload={() => setShowFileUpload(true)}
          />

          {/* File Upload Modal */}
          {showFileUpload && (
            <div className="absolute inset-0 z-60">
              <FileUpload
                onUpload={() => {}}
                onClose={() => setShowFileUpload(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
