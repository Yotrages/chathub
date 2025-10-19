import { SetStateAction, useEffect, useRef } from "react";
import { IComment } from "@/types";
import { useLikeComment } from "@/hooks/usePosts";
import { useReactReelComment } from "@/hooks/useReels";
import { MoreHorizontal } from "lucide-react";
import { useScreenSize } from "@/hooks/useScreenSize";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";

interface CommentActionsProps {
  type: "post" | "reel";
  comment: IComment;
  dynamicId: string;
  showReactions: boolean;
  setShowReactions: (value: boolean) => void;
  setShowReplyForm: React.Dispatch<SetStateAction<boolean>>;
  onShowReactions: (reactions: IComment["reactions"], type: string) => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  createdAt: string;
}

export const CommentActions: React.FC<CommentActionsProps> = ({
  type,
  comment,
  dynamicId,
  showReactions,
  setShowReactions,
  setShowReplyForm,
  onShowReactions,
  handleContextMenu,
  createdAt,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isSmallScreen = useScreenSize();
  const { mutate: likeComment } = useLikeComment(dynamicId, comment._id);
  const { mutate: reactReelComment } = useReactReelComment(dynamicId, comment._id);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const reactionRef = useRef<HTMLDivElement | null>(null);

  const isLiked = user && comment.reactions?.some((r) => r.userId._id === user._id);

  const handleReaction = (emoji: string, name: string) => {
    if (type === "post") {
      likeComment({ emoji, name });
    } else {
      reactReelComment({ emoji, name });
    }
    setShowReactions(false);
  };
  
  const reactionsIcon = [
    { emoji: "👍", name: "Like" },
    { emoji: "❤️", name: "Love" },
    { emoji: "😂", name: "Laugh" },
    { emoji: "😮", name: "Wow" },
    { emoji: "😢", name: "Sad" },
    { emoji: "😡", name: "Angry" },
  ];

  const handleLongPressStart = () => {
    if (isSmallScreen) {
      longPressTimeout.current = setTimeout(() => {
        setShowReactions(true);
      }, 500);
    }
  };

  const handleLongPressEnd = () => {
    if (isSmallScreen) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      if (!showReactions) {
        handleReaction("👍", "Like");
      }
    }
  };

  const userReactionEmoji = comment.reactions?.find((r) => {
    const reactionUserId = r.userId._id || r.userId;
    return reactionUserId === user?._id;
  })?.emoji || null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionRef.current &&
        !reactionRef.current.contains(event.target as Node)
      ) {
        setShowReactions(false);
      }
    };
    if (showReactions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReactions]);

  const groupedReactions = comment.reactions?.reduce((acc, reaction) => {
    const emoji = reaction.emoji.category;
    if (!acc[emoji]) acc[emoji] = [];
    acc[emoji].push(reaction);
    return acc;
  }, {} as Record<string, Array<{ userId: any; emoji: { category: string; name: string } }>>) || {};

  return (
    <div className="flex select-none relative items-center gap-3 md:gap-4 mt-2 px-2 sm:px-4 w-full text-xs sm:text-sm">
      <span className="text-gray-500 flex-shrink-0 text-xs">{createdAt}</span>
      
      {/* Reactions popup */}
      <div
        onMouseLeave={() => setShowReactions(false)}
        className="absolute -top-24 flex items-center w-full flex-wrap z-50"
      >
        {showReactions && (
          <div ref={reactionRef} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg px-2 py-2 sm:py-3 flex items-center justify-center gap-1 backdrop-blur-sm">
            {reactionsIcon.map((item, index) => (
              <button
                key={index}
                onClick={() => handleReaction(item.emoji, item.name)}
                className="flex select-none flex-col items-center justify-center p-1 sm:px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-base sm:text-xl hover:scale-125 transition-transform duration-200">
                  {item.emoji}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Like/React button */}
      <div className="relative flex">
        <button
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onMouseOver={() => !isSmallScreen && setShowReactions(true)}
          onClick={() => userReactionEmoji ? handleReaction(userReactionEmoji.category, userReactionEmoji.name) :  handleReaction("👍", "Like")}
          className={`font-semibold transition-colors min-w-0 ${
            isLiked ? "text-red-500" : "text-gray-600 hover:text-red-500"
          }`}
        >
          {userReactionEmoji ? (
            <span className="capitalize select-none truncate text-xs sm:text-sm">{userReactionEmoji.name}</span>
          ) : (
            <span className="select-none text-xs sm:text-sm">Like</span>
          )}
        </button>
      </div>
      
      {/* Reply button */}
      <button
        onClick={() => setShowReplyForm((prev) => !prev)}
        className="font-semibold text-gray-600 hover:text-blue-600 transition-colors flex-shrink-0 text-xs sm:text-sm"
      >
        Reply
      </button>
      
      {/* Reaction count */}
      <button 
        className="flex items-center gap-0.5 min-w-0 ml-auto"
        onClick={() => comment.reactions.length > 0 && onShowReactions(comment.reactions, "comment")}
      >
        <div className="flex -space-x-0.5 items-center">
          {comment.reactions &&
            comment.reactions.length > 0 &&
            Object.entries(groupedReactions).slice(0, 2).map(([emoji]) => (
              <span
                className="text-xs sm:text-sm"
                key={emoji}
              >
                {emoji}
              </span>
            ))}
        </div>
        {comment.reactions.length > 0 && (
          <span className="hover:text-gray-800 cursor-pointer transition-colors text-gray-600 flex-shrink-0 text-xs sm:text-sm">
            {comment.reactions.length}
          </span>
        )}
      </button>
      
      {/* More options - ONLY show on desktop */}
      {!isSmallScreen && (
        <button 
          onClick={handleContextMenu}
          className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
};
