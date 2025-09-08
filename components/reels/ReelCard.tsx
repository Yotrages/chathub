"use client";

import React, { useState, useRef, useEffect, forwardRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { Reel } from "@/types/index";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import EmojiReactions from "./EmojiReactions";
import { MessageCircle, MoreHorizontal, Share2, ThumbsUp } from "lucide-react";
import { api } from "@/libs/axios/config";
import toast from "react-hot-toast";
import { useChat } from "@/hooks/useChat";
import SharePostModal from "../post/SharePostModal";
import PostComments from "../post/PostComments";
import { ReactionsModal } from "../post/LikesModal";
import { makeSelectComments } from "@/libs/redux/reelsSlice";
import { useGetReelComments } from "@/hooks/useReels";
import { EMPTY_COMMENTS } from "@/libs/redux/reelsSlice";

interface EnhancedReelCardProps {
  reel: Reel;
  onReaction?: (reelId: string, emoji: string, name: string) => void;
  isCompact?: boolean;
  isFullscreen?: boolean;
}

const ReelCard = forwardRef<HTMLDivElement | null, EnhancedReelCardProps>(
  ({ reel, onReaction, isCompact = false, isFullscreen = false }, ref) => {
    const { user } = useSelector((state: RootState) => state.auth);

    // Create memoized selector for this specific reel's comments
    const selectCommentsForReel = useMemo(() => makeSelectComments(), []);
    const comments = useSelector((state: RootState) =>
      reel?._id ? selectCommentsForReel(state, reel._id) : EMPTY_COMMENTS
    );

    const [isPlaying, setIsPlaying] = useState(!isCompact);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isMuted, setIsMuted] = useState(isCompact);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { conversations, sendMessage } = useChat();
    const [showReactions, setShowReactions] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentContent, setCommentContent] = useState("");
    const [longPressActive, setLongPressActive] = useState(false);
    const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
    
    // Add state to track if comments have been fetched and any errors
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [commentsError, setCommentsError] = useState<boolean>(false);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    const { trigger: fetchComments, isLoading: isFetchingComments } =
      useGetReelComments(reel?._id);

    localStorage.setItem('long', JSON.stringify(longPressActive));

    // Memoized function to load comments with error handling
    const loadComments = useCallback(async () => {
      if (!reel?._id || commentsLoaded) return;
      
      try {
        console.log(`Fetching comments for reelId ${reel._id}`);
        await fetchComments();
        setCommentsLoaded(true);
        setCommentsError(false);
        setRetryCount(0);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setCommentsError(true);
        // Don't set commentsLoaded to true so we can retry
      }
    }, [reel?._id, fetchComments, commentsLoaded]);

    // Retry function for failed requests
    const retryLoadComments = useCallback(async () => {
      if (retryCount >= maxRetries) {
        console.error('Max retries reached for comments');
        return;
      }
      
      setRetryCount(prev => prev + 1);
      setCommentsError(false);
      
      try {
        console.log(`Retrying comments fetch for reelId ${reel._id} (attempt ${retryCount + 1})`);
        await fetchComments();
        setCommentsLoaded(true);
        setCommentsError(false);
        setRetryCount(0);
      } catch (error) {
        console.error(`Retry ${retryCount + 1} failed:`, error);
        setCommentsError(true);
      }
    }, [reel?._id, fetchComments, retryCount, maxRetries]);

    // Only fetch comments once when the component mounts or when showComments is opened
    useEffect(() => {
      if (reel?._id && !commentsLoaded && !isFetchingComments) {
        loadComments();
      }
    }, [reel?._id, commentsLoaded, isFetchingComments, loadComments]);

    // Fetch comments when comments modal is opened (if not already loaded or failed)
    useEffect(() => {
      if (showComments && (!commentsLoaded || commentsError) && !isFetchingComments) {
        if (commentsError) {
          retryLoadComments();
        } else {
          loadComments();
        }
      }
    }, [showComments, commentsLoaded, commentsError, isFetchingComments, loadComments, retryLoadComments]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
        if (isFullscreen && ref) {
          (ref as React.MutableRefObject<HTMLDivElement>).current = videoRef
            .current.parentElement as HTMLDivElement;
        }
      }
    }, [isMuted, isFullscreen, ref]);

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
      }
    };
    
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setShowComments(false);
      }
    };

    const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMuted(!isMuted);
    };
    
    const trackShare = async () => {
      try {
        await api.post(`/reels/${reel._id}/share`);
      } catch (error) {
        console.error("Error tracking share:", error);
      }
    };

    const handleShare = async () => {
      const shareData = {
        title: `Post by ${reel.authorId?.username || "Unknown User"}`,
        url: `${window.location.origin}/reels/${reel._id}`,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          await trackShare();
          toast.success("Reel shared successfully!");
        } catch (error) {
          console.error("Error sharing reel:", error);
          toast.error("Failed to share reel. Try again.");
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          await trackShare();
          toast.success("Reel URL copied to clipboard!");
        } catch (error) {
          console.error("Error copying URL to clipboard:", error);
          toast.error("Failed to copy URL. Please try again.");
        }
      }
    };

    const handleShareToChat = async (chatId: string) => {
      try {
        const messageContent = `Check out this reel!\n${window.location.origin}/reels/${reel._id}`;
        await sendMessage(
          chatId,
          messageContent,
          "post",
          undefined,
          undefined,
          undefined,
          reel._id
        );
        toast.success("Reel shared to chat successfully!");
        setShowShareModal(false);
      } catch (error) {
        console.error("Error sharing reel to chat:", error);
        toast.error("Failed to share reel to chat. Try again.");
      }
    };

    const handleEmojiSelect = (emoji: string, name: string) => {
      if (onReaction) {
        onReaction(reel._id, emoji, name);
      }
    };

    const handleLongPressStart = () => {
      if (window.screen.availWidth < 768) {
        longPressTimeout.current = setTimeout(() => {
          setLongPressActive(true);
          setShowEmojiPicker(true);
        }, 500);
      }
    };

    const handleLongPressEnd = () => {
      if (window.screen.availWidth < 768) {
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
        setLongPressActive(false);
        if (!showEmojiPicker) handleEmojiSelect("👍", "Like");
      }
    };

    // Memoize grouped reactions to prevent recalculation on every render
    const groupedReactions = useMemo(() => {
      return (
        reel?.reactions?.reduce((acc, reaction) => {
          const emoji = reaction.emoji.category;
          if (!acc[emoji]) acc[emoji] = [];
          acc[emoji].push(reaction);
          return acc;
        }, {} as Record<string, Array<{ userId: any; emoji: { category: string; name: string } }>>) ||
        {}
      );
    }, [reel?.reactions]);

    // Memoize user reaction to prevent recalculation
    const userReactionEmoji = useMemo(() => {
      return (
        reel?.reactions?.find((r) => r.userId?._id === user?._id)?.emoji || null
      );
    }, [reel?.reactions, user?._id]);
    
    if (!reel || !reel._id) {
      return (
        <div
          className={`${
            isCompact ? "w-32 h-48" : "w-full h-full"
          } bg-gray-200 flex items-center justify-center`}
        >
          <p className="text-gray-500">Loading reel...</p>
        </div>
      );
    }

    const containerClasses = isFullscreen
      ? "w-full h-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden relative"
      : isCompact
      ? "w-32 aspect-[9/16] bg-white rounded-lg shadow-md overflow-hidden"
      : "w-full h-full bg-white rounded-lg shadow-md overflow-hidden";

    return (
      <div ref={ref} className={containerClasses}>
        <div
          className={`relative ${isCompact ? "w-32 h-48" : "w-full h-full"}`}
        >
          <video
            ref={videoRef}
            src={reel?.fileUrl}
            className="w-full h-full object-contain"
            muted={isMuted}
            playsInline
            autoPlay={!isCompact}
            loop
            onClick={togglePlay}
          />

          {/* Mute/Unmute Button - Top Right */}
          {!isCompact && (
            <button
              onClick={toggleMute}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-5 w-5" />
              ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
              )}
            </button>
          )}

          {isFullscreen && (
            <>
              {/* Action Buttons - Right Side */}
              <div className="absolute right-4 bottom-20 flex flex-col space-y-4 z-10">
                <button
                  onMouseDown={handleLongPressStart}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={handleLongPressStart}
                  onTouchEnd={handleLongPressEnd}
                  onClick={() => handleEmojiSelect("👍", "Like")}
                  onMouseOver={() =>
                    window.screen.availWidth > 768 && setShowEmojiPicker(true)
                  }
                  className="flex flex-col items-center space-y-1 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
                >
                  {userReactionEmoji ? (
                    <>
                      <span className="text-2xl">
                        {userReactionEmoji.category}
                      </span>
                      <span className="text-white text-xs font-medium">
                        {reel?.reactions?.length || 0}
                      </span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-7 w-7 text-white" />
                      <span className="text-white text-xs font-medium">
                        {reel?.reactions?.length || 0}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowComments(true)}
                  className="flex flex-col items-center space-y-1 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
                >
                  <MessageCircle className="h-7 w-7 text-white" />
                  <span className="text-white text-xs font-medium">
                    {comments?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex flex-col items-center space-y-1 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
                >
                  <Share2 className="h-7 w-7 text-white" />
                  <span className="text-white text-xs font-medium">Share</span>
                </button>

                <button className="flex flex-col items-center space-y-1 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all">
                  <MoreHorizontal className="h-7 w-7 text-white" />
                </button>
              </div>

              {/* Author Info - Bottom Left */}
              <div className="absolute bottom-4 left-4 right-20 z-10">
                <div className="flex items-start space-x-3 mb-3">
                  <img
                    src={reel?.authorId?.avatar || "/default-avatar.png"}
                    alt={reel?.authorId?.username || "Unknown User"}
                    className="w-12 h-12 rounded-full border-2 border-white flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base truncate">
                      {reel?.authorId?.username || "Unknown User"}
                    </p>
                    <p className="text-gray-300 text-sm">
                      {reel?.createdAt
                        ? new Date(reel.createdAt).toLocaleDateString()
                        : "Unknown date"}
                    </p>
                  </div>
                </div>

                {reel?.title && (
                  <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-2 mb-2">
                    <p className="text-white text-sm leading-relaxed">
                      {reel.title}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modals and Overlays */}
        <EmojiReactions
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
        />

        {showShareModal && (
          <SharePostModal
            type="Reel"
            onClose={() => setShowShareModal(false)}
            onShare={handleShareToChat}
            conversations={conversations || []}
            handleNativeShare={handleShare}
          />
        )}

        {showComments && (
          <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 w-full max-w-lg bg-black bg-opacity-75 flex items-end"
          >
            <div className="w-full h-2/3 bg-white rounded-t-2xl">
              <div className="flex flex-col h-full">
                {/* Handle */}
                <div className="flex justify-center py-2">
                  <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Reactions Summary */}
                <div className="px-4 pb-2 border-b border-gray-200">
                  <button
                    className="flex items-center space-x-2 py-2"
                    onClick={() => setShowReactions(true)}
                  >
                    {reel?.reactions && reel.reactions.length > 0 && (
                      <div className="flex -space-x-1">
                        {Object.entries(groupedReactions)
                          .slice(0, 3)
                          .map(([emoji]) => (
                            <span
                              key={emoji}
                              className="text-lg bg-white rounded-full border-2 border-white"
                            >
                              {emoji}
                            </span>
                          ))}
                      </div>
                    )}
                    <span className="text-gray-600 text-sm font-medium">
                      {reel?.reactions?.length?.toLocaleString() || 0} reactions
                    </span>
                  </button>
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-auto">
                  {isFetchingComments ? (
                    <p className="text-gray-500 text-center py-4">
                      Loading comments...
                    </p>
                  ) : commentsError ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-2">Failed to load comments</p>
                      <button
                        onClick={retryLoadComments}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        disabled={retryCount >= maxRetries}
                      >
                        {retryCount >= maxRetries ? 'Max retries reached' : 'Retry'}
                      </button>
                    </div>
                  ) : (
                    <PostComments
                      type="reel"
                      dynamicId={reel._id}
                      comments={comments}
                      user={user}
                      commentContent={commentContent}
                      setCommentContent={setCommentContent}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showReactions && reel?.reactions && (
          <ReactionsModal
            reactions={reel.reactions}
            isOpen={showReactions}
            onClose={() => setShowReactions(false)}
            type="Reel"
          />
        )}
      </div>
    );
  }
);

ReelCard.displayName = "ReelCard";

export default ReelCard;