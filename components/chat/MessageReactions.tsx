"use client";
import { MoreVertical, Smile } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { useChat } from "@/hooks/useChat";
import { Message } from "@/types";
import toast from "react-hot-toast";
import { ReactionsModal } from "../post/LikesModal";
import { useState } from "react";

interface MessageReactionsProps {
  message: Message;
  isOwn: boolean;
  currentUserId?: string;
  handleContextMenu: (e: React.MouseEvent) => void;
  showReactions: boolean;
  onToggleReactions: (e: React.MouseEvent) => void;
  onCloseReactions: () => void;
}

export const MessageReactions = ({
  message,
  isOwn,
  handleContextMenu,
  showReactions,
  onToggleReactions,
  onCloseReactions,
}: MessageReactionsProps) => {
  const { addReaction, removeReaction } = useChat();
  const { user } = useSelector((state: RootState) => state.auth);
  const [likesModal, setLikesModal] = useState<{
    isOpen: boolean;
    reactions: Message["reactions"];
    type: string;
  }>({ isOpen: false, reactions: [], type: "reply" });

  const reactionEmojis = [
    { emoji: "👍", label: "Like" },
    { emoji: "❤️", label: "Love" },
    { emoji: "😂", label: "Laugh" },
    { emoji: "😮", label: "Wow" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😡", label: "Angry" },
  ];

  const handleReaction = async (emoji: string): Promise<void> => {
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
        await addReaction(message._id, emoji);
        toast.success("Reaction added");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update reaction");
    }
    onCloseReactions();
  };

  const handleReactionModal = (
    reactions: Message["reactions"],
    type: string = "message"
  ) => {
    setLikesModal({ isOpen: true, reactions: reactions, type: type });
  };

  const handleCloseLikes = (): void => {
    setLikesModal({ isOpen: false, reactions: [], type: "reply" });
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
    <>
      {/* Hover Controls */}
      <div className="hidden md:flex absolute right-0 bottom-0 transform -translate-y-1/2 -translate-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 p-1 space-x-1 z-10">
        <button
          onClick={onToggleReactions}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="React to message"
        >
          <Smile size={14} />
        </button>
        <button
          onClick={handleContextMenu}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="More options"
        >
          <MoreVertical size={14} />
        </button>
      </div>
      {/* Existing Reactions */}
      {Object.keys(groupedReactions).length > 0 && (
        <div
          className={`mt-2 ${
            isOwn ? "flex justify-end" : "flex justify-start"
          }`}
        >
          <div
            className={`flex flex-wrap items-center gap-1.5 min-w-[120px] max-w-full ${
              isOwn ? "justify-end" : "justify-start"
            }`}
          >
            {Object.entries(groupedReactions)
              .slice(0, 4)
              .map(([emoji, reactions]) => {
                const userHasReacted = reactions.some((r) => {
                  const userId =
                    typeof r.userId === "string" ? r.userId : r.userId?._id;
                  return userId === user?._id;
                });

                return (
                  <div
                    key={emoji}
                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-all duration-200 flex-shrink-0 ${
                      userHasReacted
                        ? isOwn
                          ? "bg-blue-500 text-white ring-2 ring-blue-200 shadow-md"
                          : "bg-blue-100 text-blue-700 ring-2 ring-blue-300 shadow-md"
                        : isOwn
                        ? "bg-gray-700 text-white hover:bg-gray-600 shadow-sm"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm"
                    } hover:shadow-lg hover:scale-105 active:scale-95`}
                    onClick={() => handleReactionModal(message.reactions, 'message')}
                    title={`${reactions.length} ${
                      reactions.length === 1 ? "reaction" : "reactions"
                    } • Click to see who reacted`}
                  >
                    <span className="text-sm leading-none select-none">
                      {emoji}
                    </span>
                    <span className="text-xs font-semibold leading-none min-w-[12px] text-center">
                      {reactions.length > 99 ? "99+" : reactions.length}
                    </span>
                  </div>
                );
              })}
            {Object.keys(groupedReactions).length > 4 && (
              <div
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleReactionModal(message.reactions)}
                title={`+${
                  Object.keys(groupedReactions).length - 4
                } more reaction types`}
              >
                <span className="text-xs font-medium leading-none">
                  +{Object.keys(groupedReactions).length - 4}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Reaction Picker */}
      {showReactions && (
        <div
          className={`fixed inset-0 z-50 flex items-center ${
            isOwn ? "justify-end -right-2 pr-4" : "justify-start -left-6 pl-4"
          }`}
          onClick={onCloseReactions}
        >
          <div
            className="bg-white rounded-full shadow-xl p-3 flex space-x-1 border border-gray-200 transform scale-100 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {reactionEmojis.map((reaction, index) => (
              <button
                key={index}
                onClick={() => handleReaction(reaction.emoji)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors transform hover:scale-110 active:scale-95"
                title={reaction.label}
              >
                <span className="text-xl">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <ReactionsModal
        isOpen={likesModal.isOpen}
        onClose={handleCloseLikes}
        type={likesModal.type}
        reactions={likesModal.reactions}
      />
    </>
  );
};
