import { ReactionModalProps } from "@/types";
import {  X } from "lucide-react";
import { UserAvatar } from "../constant/UserAvatar";
import { useEffect, useState } from "react";

export const ReactionsModal: React.FC<ReactionModalProps> = ({
  reactions,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("All");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const emojiMap: Record<string, string> = {
    Like: "👍",
    Love: "❤️",
    Haha: "😆",
    Wow: "😮",
    Sad: "😢",
    Angry: "😠",
  };

  const emojiColors: Record<string, string> = {
    Like: "text-blue-500",
    Love: "text-red-500",
    Haha: "text-yellow-500",
    Wow: "text-yellow-500",
    Sad: "text-yellow-500",
    Angry: "text-orange-500",
  };

  const reactionCounts = reactions.reduce((acc: Record<string, number>, reaction) => {
    const category = reaction.emoji.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const sortedReactionTypes = Object.keys(reactionCounts)
    .sort((a, b) => reactionCounts[b] - reactionCounts[a]);

  const reactionTabs = ["All", ...sortedReactionTypes];

  const filteredReactions = activeTab === "All"
    ? reactions
    : reactions.filter((r) => r.emoji.category === activeTab);

  const uniqueReactions = filteredReactions.reduce((acc: typeof reactions, reaction) => {
    const existingIndex = acc.findIndex((r) => r.userId._id === reaction.userId._id);
    if (existingIndex >= 0) {
      acc[existingIndex] = reaction;
    } else {
      acc.push(reaction);
    }
    return acc;
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  // const getTotalCount = () => {
  //   return activeTab === "All" ? reactions.length : reactionCounts[activeTab] || 0;
  // };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="reactions-modal-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {/* Show top 3 emoji types */}
              {sortedReactionTypes.slice(0, 3).map((type, index) => (
                <div
                  key={type}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white bg-gray-50 ${emojiColors[type]}`}
                  style={{ zIndex: 10 - index }}
                >
                  {emojiMap[type]}
                </div>
              ))}
            </div>
            <span className="text-gray-600 text-sm font-medium">
              {reactions.length} {reactions.length === 1 ? "reaction" : "reactions"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide">
            {reactionTabs.map((tab) => {
              const count = tab === "All" ? reactions.length : reactionCounts[tab];
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab !== "All" && (
                    <span className={`text-lg ${emojiColors[tab]}`}>
                      {emojiMap[tab]}
                    </span>
                  )}
                  <span>{tab}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reactions List */}
        <div className="max-h-96 overflow-y-auto">
          {uniqueReactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {uniqueReactions.map((reaction, index) => (
                <div
                  key={`${reaction.userId._id}-${index}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <UserAvatar
                      username={reaction.userId.username}
                      avatar={reaction.userId.avatar}
                      className="w-10 h-10"
                    />
                    {/* Emoji badge */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white bg-white shadow-sm ${emojiColors[reaction.emoji.name]}`}
                    >
                      {emojiMap[reaction.emoji.name]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 hover:underline cursor-pointer">
                      {reaction.userId.username}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-3 opacity-50">😊</div>
              <p className="text-gray-500 text-sm">No reactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};