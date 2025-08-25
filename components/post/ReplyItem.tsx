import { useLikeComment, useUpdateComment } from "@/hooks/usePosts";
import { useReactReelComment, useUpdateReelComment } from "@/hooks/useReels";
import { RootState } from "@/libs/redux/store";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "../constant/UserAvatar";
import { ChevronDown, ChevronUp, MoreHorizontal, Send } from "lucide-react";
import { ReplyForm } from "../comment/ReplyForm";
import { IComment } from "@/types";
import { FilePreview } from "./Preview";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { ContextMenu } from "../comment/ContextMenu";

interface ReplyItemProps {
  type: "post" | "reel";
  reply: IComment;
  onShowReactions: (reactions: IComment["reactions"], type: string) => void;
  dynamicId: string;
  commentId: string;
  isLast?: boolean;
  depth?: number;
}

export const ReplyItem: React.FC<ReplyItemProps> = ({
  type,
  reply,
  onShowReactions,
  dynamicId,
  commentId,
}) => {
  const [showReplies, setShowReplies] = useState<boolean>(false);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [showReactions, setShowReactions] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const { mutate: reactComment } = useLikeComment(dynamicId, reply._id);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyContent, setReplyContent] = useState(reply.content);
  const [isEditing, setIsEditing] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  const { mutate: reactReelComment } = useReactReelComment(
    dynamicId,
    reply._id
  );
  const { mutate: updatePostComment } = useUpdateComment(
    dynamicId,
    reply._id,
    () => {
      setReplyContent("");
    }
  );
  const { mutate: updateReelComment } = useUpdateReelComment(
    dynamicId,
    reply._id,
    () => {
      setReplyContent("");
    }
  );
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  const isLiked =
    user && reply.reactions?.some((r) => r.userId._id === user._id);

  const handleReaction = (emoji: string, name: string) => {
    if (type === "post") {
      reactComment({ emoji, name });
    } else {
      reactReelComment({ emoji, name });
    }
    setShowReactions(false);
  };

   const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const userReactionEmoji =
    reply.reactions?.find((r) => {
      const reactionUserId = r.userId._id || r.userId;
      return reactionUserId === user?._id;
    })?.emoji || null;

  const formatTimeAgo = (date?: Date | string): string => {
    if (!date) return "now";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
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
    if (window.screen.availWidth < 768) {
      longPressTimeout.current = setTimeout(() => {
        setShowReactions(true);
      }, 500);
    }
  };

  const handleUpdateReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim() && user) {
      const payload = {
        content: replyContent,
      };
      if (type === "post") {
        updatePostComment(payload);
      } else {
        updateReelComment(payload);
      }
    }
  };

   useEffect(() => {
      const handleScroll = () => {
        setShowContextMenu(false);
        setShowReactions(false);
      };
      document.addEventListener("scroll", handleScroll);
      return () => document.removeEventListener("scroll", handleScroll);
    }, []);

  const handleLongPressEnd = () => {
    if (window.screen.availWidth < 768) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      if (!showReactions) {
        handleReaction("👍", "Like");
      }
    }
  };

  const groupedReactions =
    reply.reactions?.reduce((acc, reaction) => {
      const emoji = reaction.emoji.category;
      if (!acc[emoji]) acc[emoji] = [];
      acc[emoji].push(reaction);
      return acc;
    }, {} as Record<string, Array<{ userId: any; emoji: { category: string; name: string } }>>) ||
    {};

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setReplyContent(replyContent + emojiData.emoji);
  };

  return (
    <div className="mt-3 relative">
      <div className="flex gap-2 relative">
        <UserAvatar
          username={reply.authorId.username}
          avatar={reply.authorId.avatar}
          className="w-7 h-7 flex-shrink-0 relative z-10"
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleUpdateReply} className="w-full">
              <div className="flex-1 relative flex space-x-2 xs:space-x-6">
                <span className="flex flex-1 relative">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 bottom-2 hover:scale-110 transition-transform"
                  >
                    😊
                  </button>
                </span>
                <button
                  type="submit"
                  disabled={
                    !replyContent.trim() || reply.content === replyContent
                  }
                  className="px-4 bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <Send size={18} />
                </button>
                {showEmojiPicker && (
                  <div
                    ref={emojiRef}
                    className="absolute bottom-12 right-0 z-10"
                  >
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </form>
          ) : (
            <>
              <div className="bg-gray-50 rounded-2xl px-3 py-2 hover:bg-gray-100 transition-colors">
                <div className="font-semibold text-sm text-gray-900">
                  {reply.authorId.username}
                </div>
                <div className="text-sm text-gray-800 mt-0.5 break-words">
                  {reply.content}
                </div>
                {reply.file && <FilePreview url={reply.file} />}
              </div>

              <div className="flex relative items-center gap-4 mt-1 px-3">
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(reply.createdAt)}
                </span>
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
                          <span className="hover:scale-150 transition-all duration-200">
                            {item.emoji}
                          </span>
                          <span className="font-medium text-xs">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onMouseDown={handleLongPressStart}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={handleLongPressStart}
                  onTouchEnd={handleLongPressEnd}
                  onMouseOver={() =>
                    window.screen.availWidth > 768 && setShowReactions(true)
                  }
                  className={`text-xs font-semibold transition-colors ${
                    isLiked
                      ? "text-red-500"
                      : "text-gray-600 hover:text-red-500"
                  }`}
                >
                  {userReactionEmoji ? (
                    <p>{userReactionEmoji.name}</p>
                  ) : (
                    <p>like</p>
                  )}
                </button>
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Reply
                </button>
                <button className="p-0 m-0">
                  {reply.reactions &&
                    reply.reactions.length > 0 &&
                    Object.entries(groupedReactions).map(([emoji]) => (
                      <span
                        className="text-base"
                        onClick={() =>
                          onShowReactions(reply.reactions, "reply")
                        }
                        key={emoji}
                      >
                        {emoji}
                      </span>
                    ))}
                  <span className="hover:text-gray-800 cursor-pointer transition-colors">
                    {reply.reactions && reply.reactions.length}
                  </span>
                </button>
                <button onClick={handleContextMenu}>
                        <MoreHorizontal className="w-4 h-4 text-gray-600" />
                      </button>
              </div>
            </>
          )}
        </div>
      </div>
      {showReplyForm && (
        <div className="relative mt-3">
          <ReplyForm
            type={type}
            dynamicId={dynamicId}
            commentId={commentId}
            username={user?.username || ""}
            avatar={user?.avatar || ""}
            onClose={() => setShowReplyForm(false)}
            parentCommentId={reply._id} // Pass reply._id as parentCommentId
          />
        </div>
      )}
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2 relative">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-3 relative z-10"
          >
            {showReplies ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showReplies ? "Hide" : "Show"} {reply.replies.length}{" "}
            {reply.replies.length === 1 ? "reply" : "replies"}
          </button>
          {showReplies && (
            <div className="mt-2 relative">
              {reply.replies.map((nestedReply, index) => (
                <div key={index} className="relative">
                  <ReplyItem
                    type={type}
                    commentId={commentId}
                    dynamicId={dynamicId}
                    reply={nestedReply}
                    onShowReactions={onShowReactions}
                    isLast={reply.replies && index === reply.replies.length - 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <ContextMenu
        setIsEditing={setIsEditing}
        type={type}
        dynamicId={dynamicId}
        commentId={reply._id}
        show={showContextMenu}
        position={contextMenuPosition}
        commentContent={reply.content}
        onClose={() => setShowContextMenu(false)}
        onReact={() => {
          setShowReactions(true);
          setShowContextMenu(false);
        }}
        onReply={() => {
          setShowReplyForm(true);
          setShowContextMenu(false);
        }}
      />
    </div>
  );
};
