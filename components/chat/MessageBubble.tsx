"use client";
import { useRef, useState, useEffect } from "react";
import { Message } from "@/types";
import { MessageContent } from "./MessageContent";
import { MessageContextMenu } from "./MessageContextMenu";
import { MessageReactions } from "./MessageReactions";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId?: string;
}

export const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  currentUserId,
}: MessageBubbleProps) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  
  const sender = typeof message.senderId === "string"
    ? { _id: message.senderId, username: "Unknown", avatar: "" }
    : message.senderId;

  // Handle click outside for context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showContextMenu]);

  // Handle click outside for reactions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (messageRef.current && !messageRef.current.contains(target)) {
        setShowReactions(false);
      }
    };

    if (showReactions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReactions]);

  const handleLongPressStart = (e: React.TouchEvent): void => {
    e.preventDefault();
    const timer = setTimeout(() => {
      setShowContextMenu(true);
      setContextMenuPosition({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = (): void => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
    setShowReactions(false); // Close reactions when context menu opens
  };

  const handleReactionToggle = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setShowReactions(!showReactions);
    setShowContextMenu(false); // Close context menu when reactions open
  };

  const handleCloseContextMenu = (): void => {
    setShowContextMenu(false);
  };

  const handleCloseReactions = (): void => {
    setShowReactions(false);
  };

  // const handleEditToggle = (): void => {
  //   setIsEditing(!isEditing);
  //   setShowContextMenu(false);
  // };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`flex max-w-xs sm:max-w-sm md:max-w-md ${
          isOwn ? "flex-row-reverse" : "flex-row"
        } group`}
      >
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0 overflow-hidden">
            {sender.avatar ? (
              <img
                src={sender.avatar}
                alt={sender.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-semibold">
                {sender.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
        <div
          ref={messageRef}
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 rounded-bl-md"
          } shadow-sm relative select-none`}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onContextMenu={handleContextMenu}
        >
          {!isOwn && showAvatar && (
            <p
              className={`text-xs font-medium mb-1 ${
                isOwn ? "text-blue-100" : "text-gray-600"
              }`}
            >
              {sender.username}
            </p>
          )}
          
          <MessageContent 
            isEditing={isEditing} 
            onClose={() => setIsEditing(false)} 
            message={message} 
            isOwn={isOwn} 
          />
          
          <MessageReactions
            showReactions={showReactions}
            onToggleReactions={handleReactionToggle}
            onCloseReactions={handleCloseReactions}
            handleContextMenu={handleContextMenu}
            message={message}
            isOwn={isOwn}
            currentUserId={currentUserId}
          />
        </div>
      </div>
      
      <MessageContextMenu
      ref={messageRef}
        setShowReaction={setShowReactions}
        setIsEditing={setIsEditing}
        message={message}
        isOwn={isOwn}
        show={showContextMenu}
        position={contextMenuPosition}
        onClose={handleCloseContextMenu}
      />
    </div>
  );
};
