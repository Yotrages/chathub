"use client";

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
import { X, Check } from "lucide-react";
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const { mutate: updatePostComment } = useUpdateComment(dynamicId, comment._id, () => {
    setIsEditing(false);
  });
  
  const { mutate: updateReelComment } = useUpdateReelComment(dynamicId, comment._id, () => {
    setIsEditing(false);
  });

  const isSmallScreen = useScreenSize();
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [commentContent, isEditing]);

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleMobileLongPress = () => {
    if (isSmallScreen) {
      const headerElement = document.querySelector(`#comment-${comment._id} .comment-header-wrapper`);
      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        setContextMenuPosition({ 
          x: rect.left + rect.width / 2, 
          y: rect.top + rect.height / 2 
        });
      } else {
        setContextMenuPosition({ 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 2 
        });
      }
      setShowContextMenu(true);
    }
  };

  const handleUpdateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim() && user && commentContent !== comment.content) {
      const payload = { content: commentContent };
      if (type === "post") {
        updatePostComment(payload);
      } else {
        updateReelComment(payload);
      }
    }
  };

  const handleCancelEdit = () => {
    setCommentContent(comment.content);
    setIsEditing(false);
    setShowEmojiPicker(false);
  };

  const handleViewReplies = () => {
    if (isSmallScreen && comment.replies?.length) {
      const replyId = comment.replies[0]._id;
      router.push(
        `/reply?commentId=${comment._id}&dynamicId=${dynamicId}&type=${type}&replyId=${replyId}`
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
      setShowEmojiPicker(false);
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
      <div className="flex gap-2 sm:gap-3 relative px-2 sm:px-0">
        <UserAvatar
          username={comment.authorId.username}
          avatar={comment.authorId.avatar}
          className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 relative z-10"
          onClick={() => router.push(`/profile/${comment.authorId._id}`)}
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="w-full">
              <form onSubmit={handleUpdateComment} className="w-full">
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border-2 border-blue-200 focus-within:border-blue-400 transition-colors">
                  <div className="font-semibold text-sm text-gray-900 mb-2">
                    {comment.authorId.username}
                  </div>
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Edit your comment..."
                      rows={1}
                      className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-800 placeholder-gray-500"
                      style={{ minHeight: '20px' }}
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
                    disabled={!commentContent.trim() || commentContent === comment.content}
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
              <div className="comment-header-wrapper">
                <CommentHeader
                  username={comment.authorId.username}
                  content={comment.content}
                  file={comment.file}
                  onLongPress={handleMobileLongPress}
                  isMobile={isSmallScreen}
                />
              </div>
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
                <div className="relative mt-3">
                  <div className="absolute left-[-0.75rem] sm:left-[-1.25rem] top-0 bottom-0 w-0.5 bg-gray-200"></div>
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
