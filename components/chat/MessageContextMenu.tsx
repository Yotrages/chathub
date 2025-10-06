"use client";
import { forwardRef, SetStateAction, useState } from "react";
import {
  Reply,
  Copy,
  Forward,
  Edit,
  Trash2,
  Star,
  Pin,
  Info,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { Message } from "@/types";
import { setReplyingTo } from "@/libs/redux/chatSlice";
import toast from "react-hot-toast";
import { UserAvatar } from "../constant/UserAvatar";

interface MessageContextMenuProps {
  message: Message;
  isOwn: boolean;
  show: boolean;
  position: { x: number; y: number };
  setShowReaction: React.Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  setIsEditing: React.Dispatch<SetStateAction<boolean>>;
}

export interface MessageInfo {
  messageId: string;
  content: string;
  sender: { _id: string; username: string; avatar?: string };
  createdAt: string;
  updatedAt: string;
  readBy: Array<{ userId: { _id: string; username: string; avatar?: string }; readAt: string }>;
}

export const MessageContextMenu = forwardRef<
  HTMLDivElement,
  MessageContextMenuProps
>(
  (
    { message, isOwn, show, position, onClose, setIsEditing },
    ref
  ) => {
    const dispatch = useDispatch();
    const {
      deleteMessage,
      pinMessage,
      unpinMessage,
      forwardMessage,
      starMessage,
      unstarMessage,
      getMessageInfo,
      addReaction,
    } = useChat();
    const { chats, pinnedMessages, starredMessages } = useSelector(
      (state: RootState) => state.chat
    );
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [messageInfo, setMessageInfo] = useState<MessageInfo | null>(null);
    const [infoLoading, setInfoLoading] = useState(false);
    const [infoError, setInfoError] = useState<string | null>(null);

    if (!show) return null;

    const isPinned =
      pinnedMessages?.[message.conversationId]?.some(
        (m) => m._id === message._id
      ) || false;
    const isStarred =
      starredMessages?.some((m) => m._id === message._id) || false;

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

    const handleCopy = () => {
      navigator.clipboard.writeText(message.content);
      toast.success("Message copied successfully");
      onClose();
    };

    const handleQuickReaction = async (emoji: string, name: string) => {
      try {
          await addReaction(message._id, emoji, name);
      } catch (error) {
        console.log(error);
        toast.error("Failed to update reaction");
      }
      onClose();
    };

    const handleEdit = () => {
      setIsEditing(true);
      onClose();
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
        } else {
          await pinMessage(message.conversationId, message._id);
        }
      } catch (error) {
        console.log(error);
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

    const closeModalOnly = (modalSetter: React.Dispatch<SetStateAction<boolean>>) => {
      modalSetter(false);
    };

    const menuItems = [
      {
        icon: Reply,
        label: "Reply",
        onClick: handleReply,
        color: "text-blue-600",
        hoverColor: "hover:bg-blue-50",
      },
      {
        icon: Copy,
        label: "Copy",
        onClick: handleCopy,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50",
      },
      {
        icon: Forward,
        label: "Forward",
        onClick: () => setShowForwardModal(true),
        color: "text-purple-600",
        hoverColor: "hover:bg-purple-50",
      },
      {
        icon: Star,
        label: isStarred ? "Unstar" : "Star",
        onClick: handleStar,
        color: isStarred ? "text-yellow-500" : "text-gray-600",
        hoverColor: isStarred ? "hover:bg-yellow-50" : "hover:bg-gray-50",
      },
      {
        icon: Pin,
        label: isPinned ? "Unpin" : "Pin",
        onClick: handlePin,
        color: isPinned ? "text-red-500" : "text-gray-600",
        hoverColor: isPinned ? "hover:bg-red-50" : "hover:bg-gray-50",
      },
      {
        icon: Info,
        label: "Info",
        onClick: handleInfo,
        color: "text-indigo-600",
        hoverColor: "hover:bg-indigo-50",
      },
    ];

    const ownMenuItems = [
      {
        icon: Edit,
        label: "Edit",
        onClick: handleEdit,
        color: "text-blue-600",
        hoverColor: "hover:bg-blue-50",
        show: message.messageType === "text"
      },
      {
        icon: Trash2,
        label: "Delete",
        onClick: handleDelete,
        color: "text-red-600",
        hoverColor: "hover:bg-red-50",
        show: true
      },
    ];

    return (
      <div>
        <div
          ref={ref}
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-52 max-w-64 backdrop-blur-lg hidden md:block"
          style={{
            left: position.x,
            top: position.y,
            background: "rgba(255, 255, 255, 0.95)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Reactions */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex justify-between items-center space-x-1">
              {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickReaction(emoji, ["Like", "Love", "Laugh", "Wow", "Sad", "Angry"][index])}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors transform hover:scale-110 active:scale-95"
                  title={["Like", "Love", "Laugh", "Wow", "Sad", "Angry"][index]}
                >
                  <span className="text-lg">{emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-all duration-200 ${item.hoverColor} ${item.color} group`}
            >
              <item.icon
                size={16}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
          {isOwn && (
            <>
              <hr className="my-1 border border-gray-100" />
              {ownMenuItems.filter(item => item.show).map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-all duration-200 ${item.hoverColor} ${item.color} group`}
                >
                  <item.icon
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Forward Modal */}
        {showForwardModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={(e) => {
              e.stopPropagation();
              closeModalOnly(setShowForwardModal);
            }}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    Forward Message
                  </h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeModalOnly(setShowForwardModal);
                    }}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {chats?.map((chat) => (
                    <button
                      key={chat._id}
                      onClick={() => handleForward(chat._id)}
                      className="w-full p-4 text-left hover:bg-gray-50 rounded-2xl flex items-center space-x-4 transition-all duration-200 hover:shadow-sm group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <span className="text-white text-sm font-bold">
                          {chat.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-800 truncate block">
                          {chat.name || "Unknown Chat"}
                        </span>
                        <span className="text-sm text-gray-500">
                          Tap to forward
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeModalOnly(setShowForwardModal);
                  }}
                  className="w-full px-4 py-3 bg-gray-200 rounded-2xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={(e) => {
              e.stopPropagation();
              closeModalOnly(setShowInfoModal);
            }}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Message Info</h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeModalOnly(setShowInfoModal);
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
                    <p className="text-gray-600 font-medium">Loading message info...</p>
                  </div>
                )}

                {/* Error State */}
                {infoError && !infoLoading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-red-600 font-medium text-center">{infoError}</p>
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
                          {messageInfo?.createdAt
                            ? new Date(messageInfo?.createdAt).toLocaleString()
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
                              className="flex items-center justify-between"
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
              
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeModalOnly(setShowInfoModal);
                  }}
                  className="w-full px-4 py-3 bg-gray-200 rounded-2xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MessageContextMenu.displayName = "MessageContextMenu";