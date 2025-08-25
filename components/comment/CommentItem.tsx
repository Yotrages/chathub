import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { IComment } from "@/types";
import { useRouter } from "next/navigation";
import { UserAvatar } from "../constant/UserAvatar";
import { CommentHeader } from "./CommentHeader";
import { CommentActions } from "./CommentActions";
import { ReplyForm } from "./ReplyForm";
import { RepliesSection } from "./RepliesSection";
import { ContextMenu } from "./ContextMenu";
import { formatTimeAgo } from "@/utils/formatter";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Send } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useUpdateComment } from "@/hooks/usePosts";
import { useUpdateReelComment } from "@/hooks/useReels";

interface CommentItemProps {
  type: "post" | "reel";
  comment: IComment;
  onShowReactions: (reactions: IComment["reactions"], type: string) => void;
  dynamicId: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  type,
  comment,
  onShowReactions,
  dynamicId,
}) => {
  const [showReplies, setShowReplies] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showReactions, setShowReactions] = useState(false);
  const [commentContent, setCommentContent] = useState(comment.content);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { mutate: updatePostComment } = useUpdateComment(dynamicId, comment._id, () => {
        setCommentContent("");
    });
    const { mutate: updateReelComment } = useUpdateReelComment(dynamicId, comment._id, () => {
        setCommentContent("");
    });

  const isSmallScreen = useScreenSize(); // Use hook to determine screen size
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim() && user) {
      const payload = {
        content: commentContent,
      };
      if (type === "post") {
        updatePostComment(payload);
      } else {
        updateReelComment(payload);
      }
    }
  };

  const handleViewReplies = () => {
    if (isSmallScreen && comment.replies?.length) {
      router.push(
        `/reply?commentId=${comment._id}&dynamicId=${dynamicId}&type=${type}&replyId=${comment.replies[0]._id}`
      );
    } else {
      setShowReplies(!showReplies);
    }
  };
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setCommentContent(commentContent + emojiData.emoji);
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

  return (
    <div id={`comment-${comment._id}`} className="group relative">
      <div className="flex gap-3 relative">
        <UserAvatar
          username={comment.authorId.username}
          avatar={comment.authorId.avatar}
          className="w-10 h-10 flex-shrink-0 relative z-10"
          onClick={() => router.push(`/profile/${comment.authorId._id}`)}
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleAddComment} className="w-full">
              <div className="flex-1 relative flex space-x-2 xs:space-x-6">
                <span className="flex flex-1 relative">
                  <input
                    type="text"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
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
                    !commentContent.trim() || comment.content === commentContent
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
              <CommentHeader
                username={comment.authorId.username}
                content={comment.content}
                file={comment.file}
              />
              <CommentActions
                type={type}
                comment={comment}
                dynamicId={dynamicId}
                showReactions={showReactions}
                setShowReactions={setShowReactions}
                setShowReplyForm={setShowReplyForm}
                onShowReactions={onShowReactions}
                handleContextMenu={handleContextMenu}
                createdAt={formatTimeAgo(comment.createdAt)}
              />
              {showReplyForm && (
                <div className="relative">
                  <div className="absolute left-[-1.25rem] top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <ReplyForm
                    type={type}
                    dynamicId={dynamicId}
                    commentId={comment._id}
                    username={user?.username || ""}
                    avatar={user?.avatar || ""}
                    onClose={() => setShowReplyForm(false)}
                    parentCommentId={comment._id}
                  />
                </div>
              )}
              {comment.replies && comment.replies.length > 0 && (
                <RepliesSection
                  type={type}
                  replies={comment.replies}
                  dynamicId={dynamicId}
                  commentId={comment._id}
                  showReplies={showReplies}
                  isSmallScreen={isSmallScreen}
                  onViewReplies={handleViewReplies}
                  onShowReactions={onShowReactions}
                />
              )}
            </>
          )}
        </div>
      </div>
      <ContextMenu
        setIsEditing={setIsEditing}
        type={type}
        dynamicId={dynamicId}
        commentId={comment._id}
        show={showContextMenu}
        position={contextMenuPosition}
        commentContent={comment.content}
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
