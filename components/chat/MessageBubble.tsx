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

  // Calculate smart context menu position
  const calculateContextMenuPosition = (clientX: number, clientY: number) => {
    const contextMenuWidth = 192; // min-w-48 = 192px
    const contextMenuHeight = 300; // Approximate height
    const padding = 16; // Safe padding from edges
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = clientX;
    let y = clientY;
    
    // Adjust X position if menu would overflow right edge
    if (x + contextMenuWidth > viewportWidth - padding) {
      x = viewportWidth - contextMenuWidth - padding;
    }
    
    // Adjust X position if menu would overflow left edge
    if (x < padding) {
      x = padding;
    }
    
    // Adjust Y position if menu would overflow bottom edge
    if (y + contextMenuHeight > viewportHeight - padding) {
      y = clientY - contextMenuHeight;
    }
    
    // Adjust Y position if menu would overflow top edge
    if (y < padding) {
      y = padding;
    }
    
    return { x, y };
  };

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

  // Close context menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showContextMenu]);

  const handleLongPressStart = (e: React.TouchEvent): void => {
    e.preventDefault();
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      const position = calculateContextMenuPosition(touch.clientX, touch.clientY);
      setContextMenuPosition(position);
      setShowContextMenu(true);
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
    
    const position = calculateContextMenuPosition(e.clientX, e.clientY);
    setContextMenuPosition(position);
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

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`flex max-w-[280px] sm:max-w-sm md:max-w-md ${
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
        ref={contextMenuRef}
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