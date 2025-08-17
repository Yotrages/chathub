import { SetStateAction, useRef, useState } from "react";
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
  const  isSmallScreen  = useScreenSize();
  const { mutate: likeComment } = useLikeComment(dynamicId, comment._id);
  const { mutate: reactReelComment } = useReactReelComment(dynamicId, comment._id);
  const [longPressActive, setLongPressActive] = useState(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

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
        setLongPressActive(true);
        setShowReactions(true);
      }, 500);
    }
  };

  console.log(longPressActive)

  const handleLongPressEnd = () => {
    if (isSmallScreen) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      setLongPressActive(false);
      if (!showReactions) {
        handleReaction("👍", "Like");
      }
    }
  };

  const userReactionEmoji = comment.reactions?.find((r) => {
    const reactionUserId = r.userId._id || r.userId;
    return reactionUserId === user?._id;
  })?.emoji || null;

  const groupedReactions = comment.reactions?.reduce((acc, reaction) => {
    const emoji = reaction.emoji.category;
    if (!acc[emoji]) acc[emoji] = [];
    acc[emoji].push(reaction);
    return acc;
  }, {} as Record<string, Array<{ userId: any; emoji: { category: string; name: string } }>>) || {};

  return (
    <div className="flex relative items-center sm:gap-6 gap-4 mt-2 px-4 w-full">
      <span className="text-xs text-gray-500">{createdAt}</span>
      <div
        onMouseLeave={() => setShowReactions(false)}
        className="absolute -top-24 flex items-center w-full flex-wrap"
      >
        {showReactions && (
          <div className="bg-white rounded-2xl z-10 backdrop-blur-sm border border-gray-500 px-2 py-3 flex items-center justify-center flex-wrap">
            {reactionsIcon.map((item, index) => (
              <button
                key={index}
                onClick={() => handleReaction(item.emoji, item.name)}
                className="flex flex-col items-center justify-center px-2 rounded-xl"
              >
                <span className="hover:scale-150 transition-all duration-200">{item.emoji}</span>
                <span className="font-medium text-xs">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative flex">
        <button
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onMouseOver={() => !isSmallScreen && setShowReactions(true)}
          onClick={() => handleReaction("👍", "Like")}
          className={`text-xs font-semibold transition-colors ${
            isLiked ? "text-red-500" : "text-gray-600 hover:text-red-500"
          }`}
        >
          {userReactionEmoji ? <p>{userReactionEmoji.name}</p> : <p>like</p>}
        </button>
      </div>
      <button
        onClick={() => setShowReplyForm((prev) => !prev)}
        className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
      >
        Reply
      </button>
      <button className="p-0 m-0">
        {comment.reactions &&
          comment.reactions.length > 0 &&
          Object.entries(groupedReactions).map(([emoji]) => (
            <span
              className="text-base"
              onClick={() => onShowReactions(comment.reactions, "comment")}
              key={emoji}
            >
              {emoji}
            </span>
          ))}
        <span className="hover:text-gray-800 text-xs cursor-pointer transition-colors">
          {comment.reactions.length > 0 && comment.reactions.length}
        </span>
      </button>
      <button onClick={handleContextMenu}>
        <MoreHorizontal className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
};