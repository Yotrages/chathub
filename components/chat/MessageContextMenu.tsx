"use client";
import { forwardRef, SetStateAction, useState } from "react";
import {
  Smile,
  Reply,
  Copy,
  Forward,
  Edit,
  Trash2,
  Star,
  Pin,
  Info,
  X,
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

interface MessageInfo {
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
    { message, isOwn, show, position, onClose, setIsEditing, setShowReaction },
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
    } = useChat();
    const { chats, pinnedMessages, starredMessages } = useSelector(
      (state: RootState) => state.chat
    );
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [messageInfo, setMessageInfo] = useState<MessageInfo | null>(null);

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
      } catch (error) {
        console.log(error);
        toast.error("Failed to forward message");
      }
      setShowForwardModal(false);
      // Do NOT call onClose() here to keep context menu open
    };

    const handleCopy = () => {
      navigator.clipboard.writeText(message.content);
      toast.success("Message copied successfully");
      onClose();
    };

    const handleReaction = () => {
      setShowReaction(true);
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
      try {
        const info = await getMessageInfo(message._id);
        console.log("Message info received:", info); // Debug log
        setMessageInfo(info);
        setShowInfoModal(true);
      } catch (error) {
        console.log("Error fetching message info:", error); // Debug log
        toast.error("Failed to get message info");
      }
      // Do NOT call onClose() here to keep context menu open
    };

    const handleModalClose = (
      modalSetter: React.Dispatch<SetStateAction<boolean>>
    ) => {
      modalSetter(false);
      // Explicitly prevent closing context menu
    };

    const menuItems = [
      {
        icon: Smile,
        label: "React",
        onClick: handleReaction,
        color: "text-yellow-600",
        hoverColor: "hover:bg-yellow-50",
      },
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
      },
      {
        icon: Trash2,
        label: "Delete",
        onClick: handleDelete,
        color: "text-red-600",
        hoverColor: "hover:bg-red-50",
      },
    ];

    return (
      <div>
        <div
          ref={ref}
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 min-w-52 max-w-64 backdrop-blur-lg"
          style={{
            left: position.x,
            top: position.y,
            background: "rgba(255, 255, 255, 0.95)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
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
          {message.messageType === "text" && isOwn && (
            <>
              <hr className="my-1 border border-gray-100" />
              {ownMenuItems.map((item, index) => (
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
            onClick={() => handleModalClose(setShowForwardModal)}
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
                    onClick={() => handleModalClose(setShowForwardModal)}
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
                  onClick={() => handleModalClose(setShowForwardModal)}
                  className="w-full px-4 py-3 bg-gray-200 rounded-2xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Info Modal */}
        {showInfoModal && messageInfo && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={() => handleModalClose(setShowInfoModal)}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Message Info</h2>
                  <button
                    onClick={() => handleModalClose(setShowInfoModal)}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Sender
                  </p>
                  <p className="text-base text-gray-900">
                    {messageInfo.sender?.username || "Unknown"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Content
                  </p>
                  <p className="text-sm text-gray-900 break-words leading-relaxed">
                    {messageInfo.content || "No content"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl">
                    <p className="text-sm font-semibold text-blue-700 mb-2">
                      Sent
                    </p>
                    <p className="text-sm text-blue-900">
                      {messageInfo.createdAt
                        ? new Date(messageInfo.createdAt).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-2xl">
                    <p className="text-sm font-semibold text-green-700 mb-2">
                      Status
                    </p>
                    <p className="text-sm text-green-900 font-medium">
                      {messageInfo.readBy.length > 0
                        ? "✓✓ Read"
                        : "✓ Delivered"}
                    </p>
                  </div>
                </div>
                {messageInfo.readBy && messageInfo.readBy.length > 0 && (
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
                          <div className="flex items-center gap-2 justify-center">
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
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => handleModalClose(setShowInfoModal)}
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