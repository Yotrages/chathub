"use client";
import { useState } from "react";
import { Chat } from "@/types";
import { Users, X } from "lucide-react";
import { UserAvatar } from "../constant/UserAvatar";

interface SharePostModalProps {
  type: string
  onClose: () => void;
  onShare: (chatId: string) => void;
  conversations: Chat[];
  handleNativeShare: () => void;
}

const SharePostModal: React.FC<SharePostModalProps> = ({
  onClose,
  onShare,
  conversations,
  handleNativeShare,
  type,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((chat) =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Share {type}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={handleNativeShare}
          className="w-full p-3 mb-4 text-left flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-lg"
        >
          <span className="text-green-500">📱</span>
          <span>Share via...</span>
        </button>
        {filteredConversations.length > 0 ? (
          <ul className="space-y-2">
            {filteredConversations.map((chat) => (
              <li key={chat._id}>
                <button
                  onClick={() => onShare(chat._id)}
                  className="w-full p-3 text-left flex items-center space-x-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="flex-shrink-0 mr-3">
                    {chat.type === "group" ? (
                      <>
                        {chat?.avatar ? (
                          <div className="w-12 h-12">
                            <UserAvatar
                              username={chat.name}
                              avatar={chat.avatar}
                              className="w-12 h-12"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <Users className="text-white" size={20} />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {chat?.avatar ? (
                          <div className="w-12 h-12">
                            <UserAvatar
                              username={chat.name}
                              avatar={chat.avatar}
                              className="w-12 h-12"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {chat.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <span>{chat.name || "Unnamed Chat"}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No chats found.</p>
        )}
      </div>
    </div>
  );
};

export default SharePostModal;
