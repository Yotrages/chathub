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
      {/* Hover Controls - Improved positioning to prevent overflow */}
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

      {/* Existing Reactions - Fixed to not overflow beyond message width */}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            {Object.entries(groupedReactions).slice(0, 4).map(([emoji, reactions]) => {
              const userHasReacted = reactions.some((r) => {
                const userId = typeof r.userId === "string" ? r.userId : r.userId?._id;
                return userId === user?._id;
              });
              
              return (
                <div
                  key={emoji}
                  className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-xs cursor-pointer transition-all flex-shrink-0 ${
                    userHasReacted
                      ? isOwn
                        ? "bg-blue-300 text-white ring-1 ring-blue-200"
                        : "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                      : isOwn
                      ? "bg-blue-400 text-white hover:bg-blue-300"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  } shadow-sm hover:shadow-md`}
                  onClick={() => handleReaction(emoji)}
                  title={`${reactions.length} ${reactions.length === 1 ? 'reaction' : 'reactions'}`}
                >
                  <span className="text-xs leading-none">{emoji}</span>
                  <span className="text-xs font-medium leading-none">
                    {reactions.length > 9 ? '9+' : reactions.length}
                  </span>
                </div>
              );
            })}
            {Object.keys(groupedReactions).length > 4 && (
              <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 flex-shrink-0">
                <span className="text-xs leading-none">+{Object.keys(groupedReactions).length - 4}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reaction Picker */}
      {showReactions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
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
    </>
  );
};