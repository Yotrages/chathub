import { useLikeComment, useUpdateComment } from "@/hooks/usePosts";
import { useReactReelComment, useUpdateReelComment } from "@/hooks/useReels";
import { RootState } from "@/libs/redux/store";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "../constant/UserAvatar";
import { MoreHorizontal, X, Check } from "lucide-react";
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
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const reactionRef = useRef<HTMLDivElement | null>(null);
  const [replyContent, setReplyContent] = useState(reply.content);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const { user } = useSelector((state: RootState) => state.auth);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { mutate: reactComment } = useLikeComment(dynamicId, reply._id);
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
  const handleCancelEdit = () => {
    setReplyContent(reply.content);
    setIsEditing(false);
    setShowEmojiPicker(false);
  };
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setReplyContent(replyContent + emojiData.emoji);
  };
  useEffect(() => {
    const handleScroll = () => {
      setShowContextMenu(false);
      setShowReactions(false);
    };
    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);
  const groupedReactions =
    reply.reactions?.reduce((acc, reaction) => {
      const emoji = reaction.emoji.category;
      if (!acc[emoji]) acc[emoji] = [];
      acc[emoji].push(reaction);
      return acc;
    }, {} as Record<string, Array<{ userId: any; emoji: { category: string; name: string } }>>) ||
    {};
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight
      )}px`;
    }
  };

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

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [replyContent, isEditing]);

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
            <div className="w-full">
              <form onSubmit={handleUpdateReply} className="w-full">
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 border-blue-200 focus-within:border-blue-400 transition-colors">
                  <div className="font-semibold text-sm text-gray-900 mb-2">
                    {reply.authorId.username}
                  </div>
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Edit your comment..."
                      rows={1}
                      className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-800 placeholder-gray-500"
                      style={{ minHeight: "20px" }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute bottom-0 right-0 text-lg hover:scale-110 transition-transform"
                    >
                      😊
                    </button>
                  </div>

                  {showEmojiPicker && (
                    <div ref={emojiRef} className="absolute z-50 mt-2">
                      <div className="scale-75 sm:scale-100 origin-top-left">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X size={14} />
                    <span className="hidden xs:inline">Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !replyContent.trim() || replyContent === reply.content
                    }
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs sm:text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                  >
                    <Check size={14} />
                    <span className="hidden xs:inline">Save</span>
                  </button>
                </div>
              </form>
            </div>
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
              <div className="flex relative items-center gap-2 sm:gap-4 md:gap-6 mt-2 px-2 sm:px-4 w-full text-xs sm:text-sm">
                <span className="text-gray-500 flex-shrink-0">
                  {formatTimeAgo(reply.createdAt)}
                </span>

                {/* Reactions popup */}
                <div
                  onMouseLeave={() => setShowReactions(false)}
                  className="absolute -top-16 sm:-top-20 md:-top-24 left-0 right-0 flex justify-center z-20"
                >
                  {showReactions && (
                    <div
                      ref={reactionRef}
                      className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg px-2 py-2 sm:py-3 flex items-center justify-center gap-1 backdrop-blur-sm"
                    >
                      {reactionsIcon.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleReaction(item.emoji, item.name)}
                          className="flex flex-col items-center justify-center p-1 sm:px-2 rounded-lg hover:bg-gray-50 transition-colors"
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
                    onMouseOver={() =>
                      window.innerWidth > 768 && setShowReactions(true)
                    }
                    onClick={() =>
                      userReactionEmoji
                        ? handleReaction(
                            userReactionEmoji.category,
                            userReactionEmoji.name
                          )
                        : handleReaction("👍", "Like")
                    }
                    className={`font-semibold transition-colors min-w-0 ${
                      isLiked
                        ? "text-red-500"
                        : "text-gray-600 hover:text-red-500"
                    }`}
                  >
                    {userReactionEmoji ? (
                      <span className="capitalize truncate">
                        {userReactionEmoji.name}
                      </span>
                    ) : (
                      <span>Like</span>
                    )}
                  </button>
                </div>

                {/* Reply button */}
                <button
                  onClick={() => setShowReplyForm((prev) => !prev)}
                  className="font-semibold text-gray-600 hover:text-blue-600 transition-colors flex-shrink-0"
                >
                  Reply
                </button>

                {/* Reaction count */}
                <button
                  className="flex items-center min-w-0"
                  onClick={() =>
                    reply.reactions.length > 0 &&
                    onShowReactions(reply.reactions, "reply")
                  }
                >
                  <div className="flex -space-x-0.5 items-center">
                    {reply.reactions &&
                      reply.reactions.length > 0 &&
                      Object.entries(groupedReactions)
                        .slice(0, 2)
                        .map(([emoji]) => (
                          <span className="text-xs sm:text-base" key={emoji}>
                            {emoji}
                          </span>
                        ))}
                  </div>
                  {reply.reactions.length > 0 && (
                    <span className="hover:text-gray-800 cursor-pointer transition-colors text-gray-600 flex-shrink-0">
                      {reply.reactions.length}
                    </span>
                  )}
                </button>

                {/* More options */}
                <button
                  onClick={handleContextMenu}
                  className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                >
                  <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
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
            parentCommentId={reply._id}
          />
        </div>
      )}
      {reply.replies && reply.replies.length > 0 && (
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
