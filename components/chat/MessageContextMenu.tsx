"use client";
import {  RefObject, SetStateAction, useEffect, useState } from "react";
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
  ref: RefObject<HTMLDivElement | null>
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

export const MessageContextMenu: React.FC<
  MessageContextMenuProps
> = (
    { message, isOwn, show, position, onClose, setIsEditing, setShowReaction, ref }
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

         useEffect(() => {
        window.addEventListener('scroll', onClose)
        return () => window.removeEventListener('scroll', onClose)
    }, [])

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
        console.log(error)
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
        console.log(error)
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
        console.log(error)
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
        console.log(error)
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
        console.log(error)
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
          className="fixed z-50 bg-white rounded-lg shadow-lg border py-2 min-w-48"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate(-50%, -100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleReaction}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Smile size={16} />
            <span>React</span>
          </button>
          <button
            onClick={handleReply}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Reply size={16} />
            <span>Reply</span>
          </button>
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Copy size={16} />
            <span>Copy</span>
          </button>
          <button
            onClick={(e) => {
                e.stopPropagation();
                setShowForwardModal(true)
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Forward size={16} />
            <span>Forward</span>
          </button>
          <button
            onClick={handleStar}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Star size={16} />
            <span>{isStarred ? "Unstar" : "Star"}</span>
          </button>
          <button
            onClick={handlePin}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Pin size={16} />
            <span>{isPinned ? "Unpin" : "Pin"}</span>
          </button>
          <button
            onClick={handleInfo}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Info size={16} />
            <span>Info</span>
          </button>
          {isOwn && (
            <>
              <hr className="my-1" />
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>

        {/* Forward Modal */}
        {showForwardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 p-4">
              <h2 className="text-lg font-semibold mb-4">Forward Message</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {chats?.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => handleForward(chat._id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {chat.name?.charAt(0) || "U"}
                      </span>
                    </div>
                    <span>{chat.name || "Unknown Chat"}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleModalClose(setShowForwardModal)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && messageInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 p-4">
              <h2 className="text-lg font-semibold mb-4">Message Info</h2>
              <div className="space-y-2">
                <p>
                  <strong>Sender:</strong> {messageInfo.sender.username}
                </p>
                <p>
                  <strong>Content:</strong> {messageInfo.content}
                </p>
                <p>
                  <strong>Sent:</strong>{" "}
                  {new Date(messageInfo.createdAt).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {messageInfo.isRead ? "Read" : "Delivered"}
                </p>
                {messageInfo.readBy && messageInfo.readBy.length > 0 && (
                  <div>
                    <p>
                      <strong>Read by:</strong>
                    </p>
                    <ul className="list-disc pl-5">
                      {messageInfo.readBy.map((reader) => (
                        <li key={reader.user._id}>
                          {reader.user.username} at{" "}
                          {new Date(reader.readAt).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleModalClose(setShowInfoModal)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
