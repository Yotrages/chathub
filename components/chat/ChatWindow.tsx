"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { ChatHeader } from "./ChatHeader";
import { MessagesArea } from "./MessageArea";
import { FileUpload } from "./FileUpload";
import { MessageInput } from "./MessageInput";
import { useMessageManagement } from "@/hooks/useMessageManager";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCall } from "@/context/CallProvider";

interface ChatWindowProps {
  onShowProfile: () => void;
}

export const ChatWindow = ({ onShowProfile }: ChatWindowProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);

  const { activeChat, chats } = useSelector((state: RootState) => state.chat);
  const currentChat = chats.find((chat) => chat._id === activeChat);

  const { isUserOnline: currentUserOnline } = useOnlineStatus();
  const { startCall, callState, isCallMinimized } = useCall();


  const { isLoading, typingUsers, userStatuses } =
    useMessageManagement(currentChat);

  if (!currentChat) return null;

  return (
    <div 
      className="flex w-full max-w-full flex-col relative overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
  
      {(callState === "idle" || isCallMinimized) && (
        <>
          {/* Chat Header - Fixed at top */}
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

          {/* Messages Area - Flexible middle section */}
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <MessagesArea
              currentChat={currentChat}
              isUserOnline={currentUserOnline}
              isLoading={isLoading}
            />
          </div>

          {/* Message Input - Fixed at bottom */}
          <div className="flex-shrink-0 z-50">
            <MessageInput
              currentChat={currentChat}
              onShowFileUpload={() => setShowFileUpload(true)}
            />
          </div>

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