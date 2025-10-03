"use client";
import { MoreVertical, Smile } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { Message } from "@/types";
import toast from "react-hot-toast";

interface MessageReactionsProps {
  message: Message;
  isOwn: boolean;
  currentUserId?: string;
  handleContextMenu: (e: React.MouseEvent) => void;
  showReactions: boolean;
  onToggleReactions: (e: React.MouseEvent) => void;
  onCloseReactions: () => void;
  onOpenLikesModal: (reactions: Message['reactions'], type?: string) => void;
}

export const MessageReactions = ({
  message,
  // isOwn,
  handleContextMenu,
  showReactions,
  onToggleReactions,
  onCloseReactions,
}: MessageReactionsProps) => {
  const { addReaction } = useChat();

  const reactionEmojis = [
    { emoji: "👍", label: "Like" },
    { emoji: "❤️", label: "Love" },
    { emoji: "😂", label: "Laugh" },
    { emoji: "😮", label: "Wow" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😡", label: "Angry" },
  ];

  const handleReaction = async (emoji: string, name: string): Promise<void> => {
    try {
      // const userReaction = message.reactions?.find((r) => {
      //   const reactionUserId =
      //     typeof r.userId === "string" ? r.userId : r.userId?._id;
      //   return reactionUserId === user?._id;
      // });

      // if (userReaction) {
      //   await removeReaction(message._id);
      // } else {
        await addReaction(message._id, emoji, name);
      // }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update reaction");
    }
    onCloseReactions();
  };

  return (
    <>
      {/* Hover Controls - Only show on desktop */}
      <div className="hidden md:flex absolute right-0 top-1 transform -translate-y-1/2 -translate-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 p-1 space-x-1 z-10">
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

      {/* Reaction Picker */}
      {showReactions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onCloseReactions}
        >
          <div
            className="bg-white rounded-full shadow-xl p-3 flex space-x-1 border border-gray-200 transform scale-100 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {reactionEmojis.map((reaction, index) => (
              <button
                key={index}
                onClick={() => handleReaction(reaction.emoji, reaction.label)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors transform hover:scale-110 active:scale-95"
                title={reaction.label}
              >
                <span className="text-xl">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};