"use client";
import { forwardRef, SetStateAction, useEffect, useState } from "react";
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
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { Message } from "@/types";
import { setReplyingTo } from "@/libs/redux/chatSlice";
import toast from "react-hot-toast";

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
  isRead: boolean;
  readBy: Array<{ user: { _id: string; username: string }; readAt: string }>;
}

export const MessageContextMenu = forwardRef<HTMLDivElement, MessageContextMenuProps>(
  ({ message, isOwn, show, position, onClose, setIsEditing, setShowReaction }, ref) => {
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

    useEffect(() => {
      const handleScroll = () => {
        if (show) {
          onClose();
        }
      };

      if (show) {
        window.addEventListener('scroll', handleScroll, true);
        document.addEventListener('wheel', handleScroll, true);
      }

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('wheel', handleScroll, true);
      };
    }, [show, onClose]);

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
      onClose();
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
          await unstarMessage(message._id).then(() =>
            toast.success("Message unstarred")
          );
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
        setMessageInfo(info);
        setShowInfoModal(true);
      } catch (error) {
        console.log(error);
        toast.error("Failed to get message info");
      }
      onClose();
    };

    const handleModalClose = (
      modalSetter: React.Dispatch<SetStateAction<boolean>>
    ) => {
      modalSetter(false);
    };

    return (
      <>
        <div
          ref={ref}
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-48 max-w-56"
          style={{
            left: position.x,
            top: position.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleReaction}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          >
            <Smile size={16} />
            <span>React</span>
          </button>
          <button
            onClick={handleReply}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          >
            <Reply size={16} />
            <span>Reply</span>
          </button>
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          >
            <Copy size={16} />
            <span>Copy</span>
          </button>
          <button
            onClick={(e) => {
                e.stopPropagation();
                setShowForwardModal(true);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          >
            <Forward size={16} />
            <span>Forward</span>
          </button>
          <button
            onClick={handleStar}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          >
            <Star size={16} />
            <span>{isStarred ? "Unstar" : "Star"}</span>
          </button>
          <button
            onClick={handlePin}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          >
            <Pin size={16} />
            <span>{isPinned ? "Unpin" : "Pin"}</span>
          </button>
          <button
            onClick={handleInfo}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          >
            <Info size={16} />
            <span>Info</span>
          </button>
          {isOwn && (
            <>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-2 text-red-600 transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>

        {/* Forward Modal */}
        {showForwardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 p-4 max-h-[70vh] flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Forward Message</h2>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {chats?.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => handleForward(chat._id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 rounded-lg flex items-center space-x-3 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {chat.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <span className="truncate">{chat.name || "Unknown Chat"}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleModalClose(setShowForwardModal)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && messageInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 p-4 max-h-[70vh] flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Message Info</h2>
              <div className="space-y-3 flex-1 overflow-y-auto">
                <div>
                  <p className="text-sm font-medium text-gray-700">Sender</p>
                  <p className="text-sm text-gray-900">{messageInfo.sender.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Content</p>
                  <p className="text-sm text-gray-900 break-words">{messageInfo.content}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Sent</p>
                  <p className="text-sm text-gray-900">
                    {new Date(messageInfo.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className="text-sm text-gray-900">
                    {messageInfo.isRead ? "Read" : "Delivered"}
                  </p>
                </div>
                {messageInfo.readBy && messageInfo.readBy.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Read by</p>
                    <div className="space-y-1">
                      {messageInfo.readBy.map((reader) => (
                        <div key={reader.user._id} className="text-sm text-gray-900">
                          <span className="font-medium">{reader.user.username}</span>
                          <span className="text-gray-600 ml-2">
                            {new Date(reader.readAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleModalClose(setShowInfoModal)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
);

MessageContextMenu.displayName = "MessageContextMenu";