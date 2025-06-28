import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Users,
  Send,
} from "lucide-react";
import { UserAvatar } from "../common/UserAvatar";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import {IComment, IReply} from "@/types/index"
import { useAddNestedReply, useLikeComment, useAddReply, useLikeReply } from "@/hooks/usePosts";


interface CommentListProps {
  comments: IComment[];
  postId: string;
}

interface LikesModalProps {
  likes: Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  type?: string;
}

interface ReplyItemProps {
  reply: IReply;
  parentReplyId?: string;
  postId: string;
  commentId: string;
  depth?: number;
  onShowLikes: (likes: Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>, type: string) => void;
}

interface CommentItemProps {
  comment: IComment;
  postId: string;
  onShowLikes: (likes: Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>, type: string) => void;
}

const LikesModal: React.FC<LikesModalProps> = ({
  likes,
  isOpen,
  onClose,
  type = "comment",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            People who liked this {type}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        <div className="space-y-3">
          {likes.map((like, index) => (
            <div key={index} className="flex items-center gap-3">
              <UserAvatar username={like!.username} avatar={like.avatar} className="w-10 h-10" />
              <span className="font-medium text-gray-800">{like.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Reply Component
const ReplyItem: React.FC<ReplyItemProps> = ({
  reply,
  depth = 0,
  onShowLikes,
  postId,
  commentId,
}) => {
  const [showReplies, setShowReplies] = useState<boolean>(false);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);

  const { mutate: likeReply } = useLikeReply(postId, commentId, reply._id);
  const {
    isPending,
    register,
    handleSubmit,
    errors,
  } = useAddNestedReply(postId, commentId, reply._id);
  const { user } = useSelector((state: RootState) => state.auth);

  const isLiked = user && reply.likes ? 
    reply.likes.some((like) => like?._id === user.id) : false;

  const handleLike = () => {
    likeReply({ isLiked: !isLiked });
  };
  
  const formatTimeAgo = (date?: Date): string => {
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setShowReplyForm(false);
    }
  };

  return (
    <div className={`${depth > 0 ? "ml-8 mt-3" : "mt-3"}`}>
      <div className="flex gap-2">
        <UserAvatar
          username={reply.authorId.username}
          avatar={reply.authorId.avatar}
          className="w-7 h-7 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-2xl px-3 py-2 hover:bg-gray-100 transition-colors">
            <div className="font-semibold text-sm text-gray-900">
              {reply.authorId.username}
            </div>
            <div className="text-sm text-gray-800 mt-0.5 break-words">
              {reply.content}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-1 px-3">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(reply.createdAt)}
            </span>

            <button
              onClick={handleLike}
              className={`text-xs font-semibold transition-colors ${
                isLiked ? "text-red-500" : "text-gray-600 hover:text-red-500"
              }`}
            >
              Like
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
            >
              Reply
            </button>

            {reply.likes && reply.likes.length > 0 && (
              <button
                onClick={() => onShowLikes(reply.likes, "reply")}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                <span>{reply.likes.length}</span>
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-2 ml-3">
              <div className="flex gap-2">
                <UserAvatar
                  username={user!.username}
                  avatar={user!.avatar}
                  className="w-6 h-6"
                />
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center justify-center relative w-full flex-1"
                >
                  <input
                    type="text"  
                       { ...register("content") }
                    placeholder={`Reply to ${reply.authorId.username}...`}
                    className="w-full bg-gray-50 rounded-full px-3 py-1.5 text-sm border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="absolute right-2"
                  >
                    <Send className="w-4 h-4 text-black"/>
                  </button>
                </form>
                {
                      errors.content && (
                        <span className="text-red-500">
                          {errors.content.message}
                        </span>
                      )
                    }
              </div>
            </div>
          )}

          {reply.replies && reply.replies.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-3"
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
                <div className="mt-2">
                  {reply.replies.map((nestedReply, index) => (
                    <ReplyItem
                      commentId={commentId}
                      parentReplyId={reply._id}
                      postId={postId}
                      key={index}
                      reply={nestedReply}
                      depth={depth + 1}
                      onShowLikes={onShowLikes}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Comment Component
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onShowLikes,
  postId,
}) => {
  const [showReplies, setShowReplies] = useState<boolean>(false);
  const [showReplyForm, setShowReplyForm] = useState<boolean>(false);

  const formatTimeAgo = (date: Date): string => {
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
  const { isPending, register, handleSubmit, errors } = useAddReply(
    postId,
    comment._id
  );
    const { mutate: likeComment } = useLikeComment(postId, comment._id);

   const { user } = useSelector((state: RootState) => state.auth);

  const isLiked = user && comment.likes ? 
    comment.likes.some((like) => like?._id === user.id) : false;

  const handleLike = () => {
    likeComment({ isLiked: !isLiked });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setShowReplyForm(false);
    }
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        <UserAvatar
          username={comment.authorId.username}
          avatar={comment.authorId.avatar}
          className="w-10 h-10 flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-2xl px-4 py-3 hover:bg-gray-100 transition-colors">
            <div className="font-semibold text-sm text-gray-900">
              {comment.authorId.username}
            </div>
            <div className="text-sm text-gray-800 mt-1 break-words">
              {comment.content}
            </div>
          </div>

          <div className="flex items-center gap-6 mt-2 px-4">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt)}
            </span>

            <button
              onClick={handleLike}
              className={`text-xs font-semibold transition-colors ${
                isLiked ? "text-red-500" : "text-gray-600 hover:text-red-500"
              }`}
            >
              Like
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
            >
              Reply
            </button>

            {comment.likes && comment.likes.length > 0 && (
              <button
                onClick={() => onShowLikes(comment.likes, "comment")}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                <span>{comment.likes.length}</span>
              </button>
            )}

            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {showReplyForm && (
            <div className="mt-3 ml-4">
              <div className="flex gap-2">
                <UserAvatar username={user!.username} avatar={user!.avatar} className="w-8 h-8" />
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center justify-center relative w-full flex-1"
                >
                  <input
                    type="text"
                     {...register("content") }
                    placeholder={`Reply to ${comment.authorId.username}...`}
                    className="w-full bg-gray-50 rounded-full px-3 py-1.5 text-sm border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="absolute right-2"
                  >
                    <Send className="w-6 h-6 text-black"/>
                  </button>
                </form>
                      {errors.content && (
                        <span className="text-red-500">
                          {errors.content.message}
                        </span>
                      )}
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-4"
              >
                <MessageCircle className="w-4 h-4" />
                {showReplies ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {showReplies ? "Hide" : "View"} {comment.replies.length}{" "}
                {comment.replies.length === 1 ? "reply" : "replies"}
              </button>

              {showReplies && (
                <div className="mt-2">
                  {comment.replies.map((reply, index) => (
                    <ReplyItem
                      commentId={comment._id}
                      postId={postId}
                      key={index}
                      reply={reply}
                      depth={0}
                      onShowLikes={onShowLikes}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main CommentList Component
export const CommentList: React.FC<CommentListProps> = ({
  comments,
  postId,
}) => {
  const [likesModal, setLikesModal] = useState<{
    isOpen: boolean;
    likes: Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>;
    type: string;
  }>({ isOpen: false, likes: [], type: "comment" });

  const handleShowLikes = (likes: Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>, type: string): void => {
    setLikesModal({ isOpen: true, likes, type });
  };

  const handleCloseLikes = (): void => {
    setLikesModal({ isOpen: false, likes: [], type: "comment" });
  };

  // Sample data for demonstration
  const sampleComments: IComment[] = [
    {
      _id: "1",
      authorId: { username: "john_doe", avatar: "" },
      likes: [],
      content:
        "This is an amazing post! Thanks for sharing this valuable information.",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), 
      replies: [
        {
          _id: "1",
          authorId: { username: "alice_smith", avatar: "" },
          content:
            "I totally agree! This helped me understand the concept better.",
          likes: [],
          createdAt: new Date(Date.now() - 1000 * 60 * 25),
          replies: [
            {
              _id: "2",
              authorId: { username: "bob_wilson", avatar: "" },
              content: "Same here! Very well explained.",
              likes: [],
              createdAt: new Date(Date.now() - 1000 * 60 * 20), 
            },
          ],
        },
      ],
    },
    {
      _id: "2",
      authorId: { username: "sarah_connor", avatar: "" },
      likes: [],
      content:
        "Great tutorial! I learned so much from this. The examples are particularly helpful.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), 
      replies: [
        {
          _id: "1",
          authorId: { username: "tech_guru", avatar: "" },
          content:
            "Glad you found it helpful! Feel free to ask if you have any questions.",
          likes: [],
          createdAt: new Date(Date.now() - 1000 * 60 * 60), 
        },
      ],
    },
  ];

  const displayComments =
    comments && comments.length > 0 ? comments : sampleComments;

  return (
    <div className="bg-white p-4">
      <div className="space-y-4">
        {displayComments && displayComments.length > 0 ? (
          displayComments.map((comment) => (
            <CommentItem
              postId={postId}
              key={comment._id}
              comment={comment}
              onShowLikes={handleShowLikes}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No comments yet</p>
            <p className="text-gray-400 text-sm">
              Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>

      <LikesModal
        likes={likesModal.likes}
        isOpen={likesModal.isOpen}
        onClose={handleCloseLikes}
        type={likesModal.type}
      />
    </div>
  );
};