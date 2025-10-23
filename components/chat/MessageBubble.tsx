"use client";
import { useRef, useState, useEffect, SetStateAction } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { Message } from "@/types";
import { MessageContent } from "./MessageContent";
import { MessageContextMenu, MessageInfo } from "./MessageContextMenu";
import { MessageReactions } from "./MessageReactions";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { setReplyingTo } from "@/libs/redux/chatSlice";
import toast from "react-hot-toast";
import { AlertCircle, Loader2, X } from "lucide-react";
import { UserAvatar } from "../constant/UserAvatar";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId?: string;
  otherParticipantsCount: number;
  onOpenLikesModal: (reactions: Message["reactions"], type?: string) => void;
  onOpenMediaModal?: (
    src: string,
    type: "image" | "video",
    fileName?: string
  ) => void;
}

export const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  currentUserId,
  otherParticipantsCount,
  onOpenLikesModal,
  onOpenMediaModal,
}: MessageBubbleProps) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showMobileContextMenu, setShowMobileContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const sender =
    typeof message.senderId === "string"
      ? { _id: message.senderId, username: "Unknown", avatar: "" }
      : message.senderId;

  const router = useRouter();

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

    x = Math.max(
      scrollX + padding,
      Math.min(x, viewportWidth + scrollX - contextMenuWidth - padding)
    );
    y = Math.max(
      scrollY + padding,
      Math.min(y, viewportHeight + scrollY - contextMenuHeight - padding)
    );

    return { x, y };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const isModalClick =
        target.closest(".fixed.inset-0") !== null ||
        target.closest('[role="dialog"]') !== null ||
        (() => {
          let el: HTMLElement | null = target;
          while (el) {
            const zIndex = window.getComputedStyle(el).zIndex;
            if (zIndex !== "auto" && parseInt(zIndex) >= 70) {
              return true;
            }
            el = el.parentElement;
          }
          return false;
        })();

      if (isModalClick) {
        return;
      }

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

  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (showContextMenu) {
  //       setShowContextMenu(false);
  //     }
  //     if (showMobileContextMenu) {
  //       setShowMobileContextMenu(false);
  //     }
  //   };
  //   if (showContextMenu || showMobileContextMenu) {
  //     window.addEventListener("scroll", handleScroll, true);
  //   }
  //   return () => window.removeEventListener("scroll", handleScroll, true);
  // }, [showContextMenu, showMobileContextMenu]);

  const handleLongPressStart = (e: React.TouchEvent): void => {
    e.preventDefault();
    const timer = setTimeout(() => {
      setShowMobileContextMenu(true);
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

  const handleCloseMobileContextMenu = (): void => {
    setShowMobileContextMenu(false);
  };

  const handleCloseReactions = (): void => {
    setShowReactions(false);
  };

  const groupedReactions =
    message.reactions?.reduce((acc, reaction) => {
      const emoji = reaction.emoji.category;
      if (!acc[emoji]) acc[emoji] = [];
      acc[emoji].push(reaction);
      return acc;
    }, {} as Record<string, Array<{ userId: any; emoji: { category: string; name: string } }>>) ||
    {};

  return (
    <div
      className={`flex ${
        isOwn ? "justify-end" : "justify-start"
      } w-full mb-1 px-1 sm:px-4`}
    >
      <div
        className={`flex max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${
          isOwn ? "flex-row-reverse" : "flex-row"
        } group relative`}
      >
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 rounded-full xs:flex hidden items-center justify-center mr-2 flex-shrink-0 overflow-hidden shadow-sm">
            {sender.avatar ? (
              <img
                src={sender.avatar}
                alt={sender.username}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => router.push(`/profile/${sender._id}`)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 flex items-center justify-center">
                <span
                  onClick={() => router.push(`/profile/${sender._id}`)}
                  className="text-white text-xs font-bold cursor-pointer"
                >
                  {sender.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col w-full">
          <div
            ref={messageRef}
            className={`relative px-3 py-1.5 rounded-lg overflow-visible shadow-sm transition-all duration-200 ease-out group-hover:shadow-md ${
              isOwn
                ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm
                   hover:shadow-blue-200`
                : `bg-white text-gray-800 rounded-bl-sm border border-gray-100
                   hover:shadow-gray-200`
            } select-none`}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onContextMenu={handleContextMenu}
          >
            {/* Small message tail - like WhatsApp */}
            <div
              className={`absolute w-2 h-2 transform rotate-45 ${
                isOwn
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 -right-1 bottom-2"
                  : "bg-white border-l border-b border-gray-100 -left-1 bottom-2"
              }`}
            />

            {!isOwn && showAvatar && (
              <p className="text-xs font-medium mb-1 text-blue-600 opacity-80">
                {sender.username}
              </p>
            )}

            <MessageContent
              isEditing={isEditing}
              onClose={() => setIsEditing(false)}
              message={message}
              isOwn={isOwn}
              otherParticipantsCount={otherParticipantsCount}
              onOpenMediaModal={onOpenMediaModal}
            />

            <MessageReactions
              showReactions={showReactions}
              onToggleReactions={handleReactionToggle}
              onCloseReactions={handleCloseReactions}
              handleContextMenu={handleContextMenu}
              message={message}
              isOwn={isOwn}
              currentUserId={currentUserId}
              onOpenLikesModal={onOpenLikesModal}
            />
          </div>

          {/* Grouped Reactions - Outside message bubble */}
          {Object.keys(groupedReactions).length > 0 && (
            <div
              className={`mt-1 ${
                isOwn ? "flex justify-end mr-2" : "flex justify-start ml-2"
              }`}
            >
              <div className="flex flex-wrap gap-1">
                {Object.entries(groupedReactions)
                  .slice(0, 4)
                  .map(([emoji, reactions]) => (
                    <div
                      key={emoji}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs cursor-pointer transition-all duration-200 bg-gray-100 hover:bg-gray-200 border shadow-sm hover:shadow-md"
                      onClick={() =>
                        onOpenLikesModal(message.reactions, "message")
                      }
                    >
                      <span className="text-xs">{emoji}</span>
                      <span className="text-xs font-medium text-gray-600">
                        {reactions.length}
                      </span>
                    </div>
                  ))}
                {Object.keys(groupedReactions).length > 4 && (
                  <div
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 hover:bg-gray-200 cursor-pointer"
                    onClick={() => onOpenLikesModal(message.reactions)}
                  >
                    <span className="text-xs font-medium text-gray-600">
                      +{Object.keys(groupedReactions).length - 4}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
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

      {showMobileContextMenu && (
        <MobileContextMenu
          message={message}
          isOwn={isOwn}
          onClose={handleCloseMobileContextMenu}
          setIsEditing={setIsEditing}
          onOpenLikesModal={onOpenLikesModal}
        />
      )}
    </div>
  );
};

interface MobileContextMenuItemProps {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}

const MobileContextMenuItem = ({
  label,
  icon,
  onClick,
  danger = false,
}: MobileContextMenuItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-4 px-4 py-1 rounded-xl transition-colors ${
      danger ? "hover:bg-red-50 text-red-600" : "hover:bg-gray-50 text-gray-700"
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="font-medium text-left">{label}</span>
  </button>
);

interface MobileContextMenuProps {
  message: Message;
  isOwn: boolean;
  onClose: () => void;
  setIsEditing: React.Dispatch<SetStateAction<boolean>>;
  onOpenLikesModal: (reactions: Message["reactions"], type?: string) => void;
}

const MobileContextMenu = ({
  message,
  isOwn,
  onClose,
  setIsEditing,
}: MobileContextMenuProps) => {
  const dispatch = useDispatch();
  const {
    deleteMessage,
    pinMessage,
    unpinMessage,
    forwardMessage,
    starMessage,
    unstarMessage,
    addReaction,
    getMessageInfo,
    removeReaction,
  } = useChat();
  const { chats, pinnedMessages, starredMessages } = useSelector(
    (state: RootState) => state.chat
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [messageInfo, setMessageInfo] = useState<MessageInfo | null>(null);

  const isPinned =
    pinnedMessages?.[message.conversationId]?.some(
      (m) => m._id === message._id
    ) || false;
  const isStarred =
    starredMessages?.some((m) => m._id === message._id) || false;

  const handleQuickReaction = async (emoji: string, name: string) => {
    try {
      const userReaction = message.reactions?.find((r) => {
        const reactionUserId =
          typeof r.userId === "string" ? r.userId : r.userId?._id;
        return reactionUserId === user?._id;
      });

      if (userReaction) {
        await removeReaction(message._id);
        toast.success("Reaction removed");
      } else {
        await addReaction(message._id, emoji, name);
        toast.success("Reaction added");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update reaction");
    }
    onClose();
  };

  const handleReply = () => {
    dispatch(
      setReplyingTo({
        messageId: message._id,
        content: message.content,
        sender: message.senderId,
      })
    );
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Message copied successfully");
    onClose();
  };

  const handleForward = async (chatId: string) => {
    try {
      await forwardMessage(message._id, chatId);
      toast.success("Message forwarded successfully");
      setShowForwardModal(false);
      onClose();
    } catch (error) {
      console.log(error);
      toast.error("Failed to forward message");
    }
  };

  const handleStar = async () => {
    try {
      if (isStarred) {
        await unstarMessage(message._id);
        toast.success("Message unstarred");
      } else {
        await starMessage(message._id);
        toast.success("Message starred");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to star/unstar message");
    }
    onClose();
  };

  const handlePin = async () => {
    try {
      if (isPinned) {
        await unpinMessage(message.conversationId, message._id);
        toast.success("Message unpinned");
      } else {
        await pinMessage(message.conversationId, message._id);
        toast.success("Message pinned");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to pin/unpin message");
    }
    onClose();
  };

  const handleInfo = async () => {
      setShowInfoModal(true);
      setInfoLoading(true);
      setInfoError(null);
      setMessageInfo(null);
      
      try {
        const info = await getMessageInfo(message._id);
        console.log("Message info received:", info); 
        setMessageInfo(info);
      } catch (error) {
        console.log("Error fetching message info:", error);
        setInfoError("Failed to load message information. Please try again.");
      } finally {
        setInfoLoading(false);
      }
    };

  const handleDelete = async () => {
    try {
      await deleteMessage(message._id);
      toast.success("Message deleted successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete message");
    }
    onClose();
  };

  if (showForwardModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Forward Message</h2>
              <button
                onClick={() => setShowForwardModal(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {chats?.map((chat) => (
              <button
                key={chat._id}
                onClick={() => handleForward(chat._id)}
                className="w-full p-4 text-left hover:bg-gray-50 rounded-2xl flex items-center space-x-4 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {chat.name?.charAt(0) || "U"}
                  </span>
                </div>
                <span className="font-semibold text-gray-800">
                  {chat.name || "Unknown Chat"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showInfoModal) {
   return ( 
   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-blue-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Message Info</h2>
            <button
              onClick={() => {
                setShowInfoModal(false);
              }}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Loading State */}
          {infoLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-gray-600 font-medium">
                Loading message info...
              </p>
            </div>
          )}

          {/* Error State */}
          {infoError && !infoLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 font-medium text-center">
                {infoError}
              </p>
              <button
                onClick={handleInfo}
                className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Success State */}
          {messageInfo && !infoLoading && !infoError && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Sender
                </p>
                <p className="text-base text-gray-900">
                  {messageInfo?.sender?.username || "Unknown"}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Content
                </p>
                <p className="text-sm text-gray-900 break-words leading-relaxed">
                  {messageInfo?.content || "No content"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-sm font-semibold text-blue-700 mb-2">
                    Sent
                  </p>
                  <p className="text-sm text-blue-900">
                    {messageInfo?.timestamp.createdAt
                      ? new Date(messageInfo?.timestamp.createdAt).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-2xl">
                  <p className="text-sm font-semibold text-green-700 mb-2">
                    Status
                  </p>
                  <p className="text-sm text-green-900 font-medium">
                    {messageInfo?.readBy && messageInfo?.readBy.length > 0
                      ? "✓✓ Read"
                      : "✓ Delivered"}
                  </p>
                </div>
              </div>
              {messageInfo?.readBy && messageInfo?.readBy.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-2xl">
                  <p className="text-sm font-semibold text-purple-700 mb-3">
                    Read by
                  </p>
                  <div className="space-y-3">
                    {messageInfo.readBy.map((reader, index) => (
                      <div
                        key={index}
                        className="flex xs:flex-row flex-col items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            avatar={reader.userId.avatar}
                            username={reader.userId.username}
                            className="w-10 h-10 rounded-full"
                          />
                          <span className="font-medium text-purple-900">
                            {reader.userId?.username || "Unknown"}
                          </span>
                        </div>
                        <span className="text-sm text-purple-600">
                          {reader.readAt
                            ? new Date(reader.readAt).toLocaleString()
                            : "Unknown"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-end justify-center md:hidden"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md mx-auto shadow-2xl border-t border-gray-200 transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Quick Reactions */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex justify-around items-center">
            {[
              { emoji: "👍", name: "Like" },
              { emoji: "❤️", name: "Love" },
              { emoji: "😂", name: "Laugh" },
              { emoji: "😮", name: "Wow" },
              { emoji: "😢", name: "Sad" },
              { emoji: "😡", name: "Angry" },
            ].map((reaction, index) => (
              <button
                key={index}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
                onClick={() =>
                  handleQuickReaction(reaction.emoji, reaction.name)
                }
              >
                <span className="text-2xl">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-2 py-2 max-h-80 overflow-y-auto">
          <MobileContextMenuItem
            label="Reply"
            icon="↩️"
            onClick={handleReply}
          />
          <MobileContextMenuItem label="Copy" icon="📋" onClick={handleCopy} />
          <MobileContextMenuItem
            label="Forward"
            icon="📤"
            onClick={() => setShowForwardModal(true)}
          />
          <MobileContextMenuItem
            label={isStarred ? "Unstar" : "Star"}
            icon={isStarred ? "⭐" : "☆"}
            onClick={handleStar}
          />
          <MobileContextMenuItem
            label={isPinned ? "Unpin" : "Pin"}
            icon="📌"
            onClick={handlePin}
          />
          <MobileContextMenuItem label="Info" icon="📋" onClick={handleInfo} />
          {isOwn && message.messageType === "text" && (
            <MobileContextMenuItem
              label="Edit"
              icon="✏️"
              onClick={() => {
                setIsEditing(true);
                onClose();
              }}
            />
          )}
          {isOwn && (
            <MobileContextMenuItem
              label="Delete"
              icon="🗑️"
              onClick={handleDelete}
              danger
            />
          )}
        </div>

        {/* Cancel Button */}
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 text-center text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
