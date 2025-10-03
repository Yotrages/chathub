"use client";
import { useEffect, useRef, useState } from "react";
import { useLikePost } from "@/hooks/usePosts";
import { useChat } from "@/hooks/useChat";
import { MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { Post, User } from "@/types";
import { toast } from "react-hot-toast";
import SharePostModal from "./SharePostModal";
import { api } from "@/libs/axios/config";

interface PostEngagementProps {
  postId: string;
  reactions: any[];
  showComments: boolean;
  comments: any[];
  images: string[];
  user: User | null;
  showReactions: boolean;
  setShowReactions: (show: boolean) => void;
  setShowLikes: (show: boolean) => void;
  onShowComments: () => void;
  post: Post;
}
const PostEngagement: React.FC<PostEngagementProps> = ({
  postId,
  reactions,
  comments,
  images,
  user,
  showReactions,
  setShowLikes,
  setShowReactions,
  onShowComments,
  showComments,
  post,
}) => {
  const { mutate: likePost } = useLikePost(postId);
  const { conversations, sendMessage } = useChat();
  const [showShareModal, setShowShareModal] = useState(false);
  const [longPressActive, setLongPressActive] = useState(false);
  const reactionRef = useRef<HTMLDivElement | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const isLiked =
    user && reactions.length > 0
      ? reactions.some((r) => {
          const reactionUserId = r.userId?._id || r.userId;
          return reactionUserId === user?._id;
        })
      : false;
  localStorage.setItem("press", JSON.stringify(longPressActive));
  const userReactionEmoji =
    reactions.find((r) => {
      const reactionUserId = r.userId?._id || r.userId;
      return reactionUserId === user?._id;
    })?.emoji || null;
  const reactionsIcon = [
    { emoji: "👍", name: "Like" },
    { emoji: "❤️", name: "Love" },
    { emoji: "😂", name: "Laugh" },
    { emoji: "😮", name: "Wow" },
    { emoji: "😢", name: "Sad" },
    { emoji: "😡", name: "Angry" },
  ];
  const handleLike = (emoji: string, name: string) => {
    likePost({ isLiked: !isLiked, emoji, name });
    setShowReactions(false);
  };
  const trackShare = async () => {
    try {
      await api.post(`/posts/${postId}/share`);
      toast.success("Post shared successfully!");
    } catch (error) {
      console.error("Error tracking share:", error);
    }
  };
  const handleShare = async () => {
    const shareData = {
      title: `Post by ${post.authorId.username || "Unknown User"}`,
      text: post.content || "Check out this post!",
      url: `${window.location.origin}/post/${post._id}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        await trackShare();
      } catch (error: any) {
        console.error("Error sharing post:", error);
        toast.error("Failed to share post. Try again.");
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        await trackShare();
        toast.success("Post URL copied to clipboard!");
      } catch (error: any) {
        console.error("Error copying URL to clipboard:", error);
        toast.error("Failed to copy URL. Please try again.");
      }
    }
  };

  const handleShareToChat = async (chatId: string) => {
    try {
      const messageContent = `Shared post: ${
        post.content || "Check out this post!"
      }\n${window.location.origin}/post/${post._id}`;
      await sendMessage(
        chatId,
        messageContent,
        "post",
        undefined,
        undefined,
        undefined,
        post._id
      );
      toast.success("Post shared to chat successfully!");
      setShowShareModal(false);
    } catch (error: any) {
      console.error("Error sharing post to chat:", error);
      toast.error("Failed to share post to chat. Try again.");
    }
  };

  const groupedReactions =
    post.reactions?.reduce((acc, reaction) => {
      const emoji = reaction.emoji.category;
      if (!acc[emoji]) acc[emoji] = [];
      acc[emoji].push(reaction);
      return acc;
    }, {} as Record<string, Array<{ userId: any; emoji: { category: string; name: string } }>>) ||
    {};
  const handleLongPressStart = () => {
    if (window.screen.availWidth < 768) {
      longPressTimeout.current = setTimeout(() => {
        setLongPressActive(true);
        setShowReactions(true);
      }, 500);
    }
  };

  const handleLongPressEnd = () => {
    if (window.screen.availWidth < 768) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      setLongPressActive(false);
      if (!showReactions) {
        handleLike("👍", "Like");
      }
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

  return (
    <>
      <div className="px-6 py-3 border-t border-gray-50">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-4">
            <button className="p-0 m-0 flex items-center xs:-space-x-0.5 cursor-pointer">
              {post.reactions &&
                post.reactions.length > 0 &&
                Object.entries(groupedReactions)
                  .slice(0, 3)
                  .map(([emoji]) => (
                    <span
                      className="text-xs sm:text-base"
                      onClick={() => setShowLikes(true)}
                      key={emoji}
                    >
                      {emoji}
                    </span>
                  ))}
              <span className="hover:text-gray-800 text-xs sm:text-base cursor-pointer transition-colors">
                {reactions.length}
              </span>
            </button>
            <span className="hover:text-gray-800 cursor-pointer text-xs sm:text-base transition-colors">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
            <span className="hover:text-gray-800 text-xs sm:text-base cursor-pointer transition-colors">
              {post.shareCount || 0}{" "}
              {post.shareCount === 1 ? "share" : "shares"}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs sm:text-base text-gray-400">
            {images.length > 0 && <span>{images.length}</span>}
          </div>
        </div>
      </div>
      <div className="px-3 relative py-3 border-t border-gray-50">
        <div
          onMouseLeave={() => setShowReactions(false)}
          className="absolute -top-24"
        >
          {showReactions && (
            <div
              ref={reactionRef}
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg px-2 py-2 sm:py-3 flex items-center justify-center gap-1 backdrop-blur-sm"
            >
              {reactionsIcon.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleLike(item.emoji, item.name)}
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
        <div className="grid grid-cols-3 gap-1">
          <button
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onMouseOver={() =>
              window.screen.availWidth > 768 && setShowReactions(true)
            }
            onClick={() => userReactionEmoji ? handleLike(userReactionEmoji.category, userReactionEmoji.name) : handleLike("👍", "Like")}
            className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-all duration-200 ${
              isLiked
                ? "text-red-500 bg-red-50 hover:bg-red-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-red-500"
            }`}
          >
            {userReactionEmoji ? (
              <>
                <span className="text-[20px]">
                  {userReactionEmoji.category}
                </span>
                <span className="font-medium flex qy:hidden">
                  {reactions.length}
                </span>
                <span className="font-medium hidden qy:flex">
                  {userReactionEmoji.name}
                </span>
              </>
            ) : (
              <>
                <ThumbsUp
                  size={20}
                  fill={isLiked ? "currentColor" : "none"}
                  className="transition-transform duration-200 hover:scale-110"
                />
                <span className="font-medium flex qy:hidden">
                  {reactions.length}
                </span>
                <span className="font-medium hidden qy:flex">Like</span>
              </>
            )}
          </button>
          <button
            onClick={onShowComments}
            className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-all duration-200 ${
              showComments
                ? "text-blue-500 bg-blue-50 hover:bg-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
            }`}
          >
            <MessageCircle size={20} />
            <span className="font-medium hidden qy:flex">Comment</span>
            <span className="flex qy:hidden">{comments?.length}</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-green-500 transition-all duration-200"
          >
            <Share2 size={20} />
            <span className="font-medium hidden qy:flex">Share</span>
            <span className="flex qy:hidden">{post.shareCount}</span>
          </button>
        </div>
      </div>
      {showShareModal && (
        <SharePostModal
          type="Post"
          onClose={() => setShowShareModal(false)}
          onShare={handleShareToChat}
          conversations={conversations || []}
          handleNativeShare={handleShare}
        />
      )}
    </>
  );
};

export default PostEngagement;
