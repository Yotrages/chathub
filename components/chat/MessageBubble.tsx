"use client";
import { useRef, useState, useEffect } from "react";
import { Message } from "@/types";
import { MessageContent } from "./MessageContent";
import { MessageContextMenu } from "./MessageContextMenu";
import { MessageReactions } from "./MessageReactions";
import { useRouter } from "next/navigation";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId?: string;
  otherParticipantsCount: number;
}

export const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  currentUserId,
  otherParticipantsCount,
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

    const router = useRouter()
  // Calculate smart context menu position
  const calculateContextMenuPosition = (clientX: number, clientY: number) => {
    const contextMenuWidth = 240;
    const contextMenuHeight = 400;
    const padding = 20;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    let x = clientX + scrollX;
    let y = clientY + scrollY;

    if (x + contextMenuWidth > viewportWidth + scrollX - padding) {
      x = Math.max(scrollX + padding, clientX + scrollX - contextMenuWidth);
    }

    if (y + contextMenuHeight > viewportHeight + scrollY - padding) {
      y = Math.max(scrollY + padding, clientY + scrollY - contextMenuHeight);
    }

    x = Math.max(scrollX + padding, Math.min(x, viewportWidth + scrollX - contextMenuWidth - padding));
    y = Math.max(scrollY + padding, Math.min(y, viewportHeight + scrollY - contextMenuHeight - padding));

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
    setShowReactions(false);
  };

  const handleReactionToggle = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setShowReactions(!showReactions);
    setShowContextMenu(false);
  };

  const handleCloseContextMenu = (): void => {
    setShowContextMenu(false);
  };

  const handleCloseReactions = (): void => {
    setShowReactions(false);
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 px-4`}>
      <div
        className={`flex max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${
          isOwn ? "flex-row-reverse" : "flex-row"
        } group relative`}
      >
         {showAvatar && !isOwn && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden shadow-md">
            {sender.avatar ? (
              <img
                src={sender.avatar}
                alt={sender.username}
                className="w-full h-full object-cover"
                onClick={() => router.push(`/profile/${sender._id}`)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 flex items-center justify-center">
                <span onClick={() => router.push(`/profile/${sender._id}`)} className="text-white text-xs font-bold">
                  {sender.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Message container with minimum width for reactions */}
        <div
          ref={messageRef}
          className={`relative px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-200 ease-out group-hover:shadow-xl min-w-[140px] ${
            isOwn
              ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md
                 shadow-blue-200 hover:shadow-blue-300 transform hover:scale-[1.02]`
              : `bg-white text-gray-800 rounded-bl-md border border-gray-100
                 shadow-gray-200 hover:shadow-gray-300 transform hover:scale-[1.02]`
          } select-none`}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onContextMenu={handleContextMenu}
        >
          {/* Message tail/pointer */}
          <div
            className={`absolute w-3 h-3 transform rotate-45 ${
              isOwn
                ? "bg-gradient-to-br from-blue-500 to-blue-600 -right-1 bottom-3"
                : "bg-white border-l border-b border-gray-100 -left-1 bottom-3"
            }`}
          />

          {!isOwn && showAvatar && (
            <p className="text-xs font-semibold mb-2 text-blue-600 opacity-80">
              {sender.username}
            </p>
          )}

          <MessageContent
            isEditing={isEditing}
            onClose={() => setIsEditing(false)}
            message={message}
            isOwn={isOwn}
            otherParticipantsCount={otherParticipantsCount}
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