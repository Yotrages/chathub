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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 dark:bg-gray-750">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {/* Show top 3 emoji types */}
              {sortedReactionTypes.slice(0, 3).map((type, index) => (
                <div
                  key={type}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white dark:border-gray-800 bg-gray-50 dark:bg-gray-700 ${emojiColors[type]}`}
                  style={{ zIndex: 10 - index }}
                >
                  {emojiMap[type]}
                </div>
              ))}
            </div>
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              {reactions.length} {reactions.length === 1 ? "reaction" : "reactions"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto scrollbar-hide dark:bg-gray-800">
            {reactionTabs.map((tab) => {
              const count = tab === "All" ? reactions.length : reactionCounts[tab];
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
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
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
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
        <div className="max-h-96 overflow-y-auto dark:bg-gray-800">
          {uniqueReactions.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {uniqueReactions.map((reaction, index) => (
                <div
                  key={`${reaction.userId._id}-${index}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <UserAvatar
                      username={reaction.userId.username}
                      avatar={reaction.userId.avatar}
                      className="w-10 h-10"
                    />
                    {/* Emoji badge */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm border-2 border-white dark:border-gray-800 bg-white dark:bg-gray-700 shadow-sm ${emojiColors[reaction.emoji.name]}`}
                    >
                      {emojiMap[reaction.emoji.name]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 dark:text-gray-100 hover:underline cursor-pointer">
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