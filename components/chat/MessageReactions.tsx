"use client";
import { MoreVertical, Smile } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
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
}

export const MessageReactions = ({
  message,
  isOwn,
  handleContextMenu,
  showReactions,
  onToggleReactions,
  onCloseReactions
}: MessageReactionsProps) => {
  const { addReaction, removeReaction } = useChat();
  const { user } = useSelector((state: RootState) => state.auth);

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
        const reactionUserId = typeof r.userId === 'string' ? r.userId : r.userId?._id;
        return reactionUserId === user?.id;
      });

      if (userReaction) {
        await removeReaction(message._id);
        toast.success("Reaction removed");
      } else {
        await addReaction(message._id, emoji);
        toast.success("Reaction added");
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to update reaction");
    }
    onCloseReactions();
  };

  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    const emoji = reaction.emoji;
    if (!acc[emoji]) acc[emoji] = [];
    acc[emoji].push(reaction);
    return acc;
  }, {} as Record<string, Array<{ userId: any; emoji: string }>>) || {};

  return (
    <>
      {/* Hover Controls */}
      <div className="hidden md:block absolute right-2 bottom-0 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleReactions}
          className={`p-1 rounded ${
            isOwn
              ? "text-blue-200 hover:text-white"
              : "text-gray-400 hover:text-gray-600"
          }`}
          title="React to message"
        >
          <Smile size={16} />
        </button>
        <button
          onClick={handleContextMenu}
          className={`p-1 rounded ${
            isOwn
              ? "text-blue-200 hover:text-white"
              : "text-gray-400 hover:text-gray-600"
          }`}
          title="More options"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Existing Reactions */}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(groupedReactions).map(([emoji, reactions]) => {
            const userHasReacted = reactions.some((r) => {
              const userId = typeof r.userId === "string" ? r.userId : r.userId?._id;
              return userId === user?.id;
            });

            return (
              <div
                key={emoji}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-all ${
                  userHasReacted
                    ? isOwn
                      ? "bg-blue-300 text-white ring-2 ring-blue-200"
                      : "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                    : isOwn
                    ? "bg-blue-400 text-white hover:bg-blue-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } shadow-sm hover:shadow-md`}
                onClick={() => handleReaction(emoji)}
                title={`${reactions.length} ${reactions.length === 1 ? 'reaction' : 'reactions'}`}
              >
                <span>{emoji}</span>
                <span>{reactions.length}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Reaction Picker */}
      {showReactions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
          onClick={onCloseReactions}
        >
          <div 
            className="bg-white rounded-full shadow-lg p-2 flex space-x-2 border"
            onClick={(e) => e.stopPropagation()}
          >
            {reactionEmojis.map((reaction, index) => (
              <button
                key={index}
                onClick={() => handleReaction(reaction.emoji)}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors transform hover:scale-110"
                title={reaction.label}
              >
                <span className="text-2xl">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
