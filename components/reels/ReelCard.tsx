"use client";
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useMemo,
  useCallback,
  useImperativeHandle,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { Reel } from "@/types/index";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import EmojiReactions from "./EmojiReactions";
import {
  MessageCircle,
  MoreHorizontal,
  Share2,
  ThumbsUp,
  Download,
  X,
} from "lucide-react";
import { api } from "@/libs/axios/config";
import toast from "react-hot-toast";
import { useChat } from "@/hooks/useChat";
import SharePostModal from "../post/SharePostModal";
import PostComments from "../post/PostComments";
import { ReactionsModal } from "../post/LikesModal";
import { makeSelectComments } from "@/libs/redux/reelsSlice";
import { useGetReelComments } from "@/hooks/useReels";
import { EMPTY_COMMENTS } from "@/libs/redux/reelsSlice";
import ReelContextMenu from "./ReelContextMenu";

interface EnhancedReelCardProps {
  reel: Reel;
  onReaction?: (reelId: string, emoji: string, name: string) => void;
  isCompact?: boolean;
  isFullscreen?: boolean;
}

export interface ReelCardRef {
  getVideoElement: () => HTMLVideoElement | null;
}

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return isOnline;
};

const getSmartVideoStyle = (videoAR: number, containerAR: number) => {  
  const tolerance = 0.15;
  const arDifference = Math.abs(videoAR - containerAR);
  
  if (videoAR < 1) {
    if (arDifference < tolerance) {
      return {
        objectFit: 'cover' as const,
        objectPosition: 'center',
        width: '100%',
        height: '100%'
      };
    } else if (videoAR < containerAR) {
      return {
        objectFit: 'contain' as const,
        objectPosition: 'center',
        width: '100%',
        height: '100%'
      };
    } else {
      return {
        objectFit: 'cover' as const,
        objectPosition: 'center',
        width: '100%',
        height: '100%'
      };
    }
  }
  
  else if (videoAR > 1.5) {
    return {
      objectFit: 'contain' as const,
      objectPosition: 'center',
      width: '100%',
      height: '100%'
    };
  }
  
  else {
    return {
      objectFit: 'cover' as const,
      objectPosition: 'center',
      width: '100%',
      height: '100%'
    };
  }
};

const ReelCard = forwardRef<ReelCardRef, EnhancedReelCardProps>(
  ({ reel, onReaction, isCompact = false, isFullscreen = false }, ref) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const isOnline = useOnlineStatus();
    
    const [videoDimensions, setVideoDimensions] = useState({ 
      width: 0, 
      height: 0, 
      aspectRatio: 0 
    });
    
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
    // const [longPressActive, setLongPressActive] = useState(false);
    const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [commentsError, setCommentsError] = useState(false);
    
    const {
      isLoading: isFetchingComments,
      refetch: fetchComments
    } = useGetReelComments(
      showComments ? reel?._id || '' : '',
      {
        queryOptions: {
          enabled: showComments && Boolean(reel?._id) && isOnline
        }
      }
    );

    useImperativeHandle(ref, () => ({
      getVideoElement: () => videoRef.current
    }), []);

    useEffect(() => {
      if (videoRef.current) {
        const video = videoRef.current;
        video.muted = isMuted;
        
        const handleLoadedMetadata = () => {
          const { videoWidth, videoHeight } = video;
          const aspectRatio = videoWidth / videoHeight;
          setVideoDimensions({
            width: videoWidth,
            height: videoHeight,
            aspectRatio
          });
          console.log(`Video dimensions: ${videoWidth}x${videoHeight}, AR: ${aspectRatio.toFixed(2)}`);
        };

        const handleLoadStart = () => {
          console.log('Video loading started');
        };

        const handleCanPlay = () => {
          console.log('Video can start playing');
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('canplay', handleCanPlay);
        
        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('loadstart', handleLoadStart);
          video.removeEventListener('canplay', handleCanPlay);
        };
      }
    }, [isMuted, reel?.fileUrl]);

    const videoStyle = useMemo(() => {
      if (!videoDimensions.aspectRatio) {
        return {
          objectFit: 'cover' as const,
          objectPosition: 'center',
          width: '100%',
          height: '100%'
        };
      }

      const containerAR = window.innerWidth / window.innerHeight;
      return getSmartVideoStyle(videoDimensions.aspectRatio, containerAR);
    }, [videoDimensions.aspectRatio]);

    const loadComments = useCallback(async () => {
      if (!isOnline || !reel?._id || commentsLoaded || isFetchingComments) {
        return;
      }
      try {
        console.log(`Fetching comments for reelId ${reel._id} in ReelCard`);
        await fetchComments();
        setCommentsLoaded(true);
        setCommentsError(false);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setCommentsError(true);
      }
    }, [isOnline, reel?._id, commentsLoaded, isFetchingComments, fetchComments]);

    useEffect(() => {
      if (showComments && !commentsLoaded && !commentsError && isOnline) {
        loadComments();
      }
    }, [showComments, loadComments, commentsLoaded, commentsError, isOnline]);

    const retryLoadComments = useCallback(async () => {
      if (!isOnline) {
        toast.error("You're offline. Check your connection and try again.");
        return;
      }
      setCommentsError(false);
      setCommentsLoaded(false);
      await loadComments();
    }, [isOnline, loadComments]);

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

    const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMuted(!isMuted);
    };

    const handleDownload = async () => {
      if (!reel?.fileUrl) {
        toast.error("Video URL not available");
        return;
      }
      try {
        setIsDownloading(true);
        const response = await fetch(reel.fileUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch video");
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const filename = `reel_${reel._id || "video"}.mp4`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Video downloaded successfully!");
      } catch (error) {
        console.error("Error downloading video:", error);
        toast.error("Failed to download video. Please try again.");
      } finally {
        setIsDownloading(false);
      }
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
          // setLongPressActive(true);
          setShowEmojiPicker(true);
        }, 500);
      }
    };

    const handleLongPressEnd = () => {
      if (window.screen.availWidth < 768) {
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
        // setLongPressActive(false);
        if (!showEmojiPicker) handleEmojiSelect("👍", "Like");
      }
    };

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
          } bg-gray-900 flex items-center justify-center rounded-lg`}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Loading reel...</p>
          </div>
        </div>
      );
    }

    const containerClasses = isFullscreen
      ? "w-full h-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-3xl mx-auto bg-black rounded-lg overflow-hidden relative aspect-[9/16]"
      : isCompact
      ? "w-24 xs:w-28 sm:w-32 aspect-[9/16] bg-gray-900 rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-200"
      : "w-full h-full bg-gray-900 rounded-lg shadow-lg overflow-hidden aspect-[9/16]";

    return (
      <div className={containerClasses}>
        <div className="relative w-full h-full overflow-hidden">
          <video
            ref={videoRef}
            src={reel?.fileUrl}
            className="absolute inset-0 w-full h-full bg-black"
            muted={isMuted}
            playsInline
            autoPlay={!isCompact}
            loop
            onClick={togglePlay}
            style={videoStyle}
          />
          
          {/* Debug Info - Remove in production */}
          {/* {isFullscreen && videoDimensions.aspectRatio > 0 && (
            <div className="absolute top-16 left-4 bg-black bg-opacity-60 backdrop-blur-sm 
                          rounded-lg p-2 text-white text-xs z-30">
              <div>Video: {videoDimensions.width}×{videoDimensions.height}</div>
              <div>AR: {videoDimensions.aspectRatio.toFixed(2)}</div>
              <div>Fit: {videoStyle.objectFit}</div>
            </div>
          )} */}
          
          {!isCompact && (
            <button
              onClick={toggleMute}
              className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4
                         bg-black bg-opacity-60 text-white rounded-full
                         p-1.5 sm:p-2 hover:bg-opacity-80 transition-all duration-200
                         border border-white border-opacity-20 z-20
                         min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px]
                         sm:flex hidden items-center justify-center"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-3 w-3 sm:h-4 text-warning-400 sm:w-4 md:h-5 md:w-5" />
              ) : (
                <SpeakerWaveIcon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              )}
            </button>
          )}
          
          {/* Play/Pause Indicator */}
          {!isPlaying && !isCompact && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-full p-3 sm:p-4">
                <div className="w-0 h-0 border-l-[12px] sm:border-l-[16px] border-l-white border-y-[8px] sm:border-y-[12px] border-y-transparent ml-1"></div>
              </div>
            </div>
          )}
          
          {isFullscreen && (
            <>
              <div
                className="absolute right-2 sm:right-3 md:right-4 bottom-16 sm:bottom-20 md:bottom-24
                            flex flex-col space-y-2 sm:space-y-3 z-20"
              >
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
                  className="flex flex-col items-center space-y-1 bg-black bg-opacity-60
                           backdrop-blur-sm rounded-sm p-1
                           hover:bg-opacity-80 transition-all duration-200
                           border border-white border-opacity-20
                           min-w-[44px] sm:min-w-[48px] md:min-w-[52px]
                           min-h-[44px] sm:min-h-[48px] md:min-h-[52px]"
                >
                  {userReactionEmoji ? (
                    <>
                      <span className="text-base sm:text-lg md:text-xl">
                        {userReactionEmoji.category}
                      </span>
                      <span className="text-white text-[10px] sm:text-xs font-medium leading-none">
                        {reel?.reactions?.length && reel.reactions.length}
                      </span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      <span className="text-white text-[10px] sm:text-xs font-medium leading-none">
                        {reel?.reactions?.length && reel.reactions.length}
                      </span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowComments(true)}
                  className="flex flex-col items-center space-y-1 bg-black bg-opacity-60
                           backdrop-blur-sm rounded-sm p-1
                           hover:bg-opacity-80 transition-all duration-200
                           border border-white border-opacity-20
                           min-w-[44px] sm:min-w-[48px] md:min-w-[52px]
                           min-h-[44px] sm:min-h-[48px] md:min-h-[52px]"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  <span className="text-white text-[10px] sm:text-xs font-medium leading-none">
                    {reel.commentsCount || 0}
                  </span>
                </button>
                
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex flex-col items-center space-y-1 bg-black bg-opacity-60
                           backdrop-blur-sm rounded-sm p-1
                           hover:bg-opacity-80 transition-all duration-200
                           border border-white border-opacity-20
                           min-w-[44px] sm:min-w-[48px] md:min-w-[52px]
                           min-h-[44px] sm:min-h-[48px] md:min-h-[52px]"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  <span className="text-white text-[10px] sm:text-xs font-medium leading-none">
                    Share
                  </span>
                </button>
                
                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex flex-col items-center space-y-1 bg-black bg-opacity-60
                           backdrop-blur-sm rounded-sm p-1
                           hover:bg-opacity-80 transition-all duration-200
                           border border-white border-opacity-20 disabled:opacity-50
                           min-w-[44px] sm:min-w-[48px] md:min-w-[52px]
                           min-h-[44px] sm:min-h-[48px] md:min-h-[52px]"
                >
                  <Download
                    className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white ${
                      isDownloading ? "animate-pulse" : ""
                    }`}
                  />
                  <span className="text-white text-[10px] sm:text-xs font-medium leading-none">
                    {isDownloading ? "..." : "Save"}
                  </span>
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex flex-col items-center space-y-1 bg-black bg-opacity-60
                             backdrop-blur-sm rounded-sm p-1
                             hover:bg-opacity-80 transition-all duration-200
                             border border-white border-opacity-20
                             min-w-[44px] sm:min-w-[48px] md:min-w-[52px]
                             min-h-[44px] sm:min-h-[48px] md:min-h-[52px]"
                  >
                    <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  </button>
                  {showDropdown && (
                    <div className="absolute bottom-full right-0 mb-2">
                      <ReelContextMenu
                        reel={reel}
                        onHide={() => setShowDropdown(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div
                className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4
                            right-16 sm:right-20 md:right-24 z-20"
              >
                <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <img
                    src={reel?.authorId?.avatar}
                    alt={reel?.authorId?.username || "Unknown User"}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full
                             border-2 border-white flex-shrink-0 object-cover bg-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-white font-semibold text-xs sm:text-sm md:text-base
                                 truncate drop-shadow-lg"
                      style={{
                        textShadow:
                          "2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)",
                      }}
                    >
                      {reel?.authorId?.username || "Unknown User"}
                    </p>
                    <p
                      className="text-gray-200 text-[10px] sm:text-xs drop-shadow-lg"
                      style={{
                        textShadow:
                          "1px 1px 3px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)",
                      }}
                    >
                      {reel?.createdAt
                        ? new Date(reel.createdAt).toLocaleDateString()
                        : "Unknown date"}
                    </p>
                  </div>
                </div>
                {reel?.title && (
                  <div
                    className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg
                                p-2 sm:p-3 mb-2 border border-white border-opacity-20
                                max-w-full overflow-hidden"
                  >
                    <p
                      className="text-white text-xs sm:text-sm leading-relaxed drop-shadow-md
                                 break-words"
                    >
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
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowComments(false);
              }
            }}
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center
                      sm:p-4"
          >
            <div
              className="w-full max-w-xs sm:max-w-sm md:max-w-lg
                          h-[85vh] sm:h-[80vh] bg-white rounded-lg flex flex-col
                          sm:mx-4"
            >
              <div
                className="flex justify-between items-center p-3 sm:p-4
                            border-b border-gray-200 flex-shrink-0"
              >
                <h3 className="text-base sm:text-lg font-semibold">Comments</h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg sm:text-xl font-bold
                           w-8 h-8 flex items-center justify-center rounded-full
                           hover:bg-gray-100 transition-colors"
                >
                  <X />
                </button>
              </div>
              {/* Reactions Summary */}
              <div className="px-3 sm:px-4 py-2 border-b border-gray-200 flex-shrink-0">
                <button
                  className="flex items-center space-x-2 py-2 w-full"
                  onClick={() => setShowReactions(true)}
                >
                  {reel?.reactions && reel.reactions.length > 0 && (
                    <div className="flex -space-x-1">
                      {Object.entries(groupedReactions)
                        .slice(0, 3)
                        .map(([emoji]) => (
                          <span
                            key={emoji}
                            className="text-sm sm:text-base bg-white rounded-full
                                     border-2 border-white"
                          >
                            {emoji}
                          </span>
                        ))}
                    </div>
                  )}
                  <span className="text-gray-600 text-xs sm:text-sm font-medium">
                    {reel?.reactions?.length?.toLocaleString() || 0} reactions
                  </span>
                </button>
              </div>
              {/* Comments Content */}
              <div className="flex-1 overflow-auto">
                {isFetchingComments ? (
                  <div className="text-center py-8">
                    <div
                      className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8
                                  border-b-2 border-blue-500 mx-auto mb-2"
                    ></div>
                    <p className="text-gray-500 text-sm">Loading comments...</p>
                  </div>
                ) : commentsError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Failed to load comments
                    </p>
                    <button
                      onClick={retryLoadComments}
                      className="bg-blue-500 text-white px-4 py-2 rounded text-sm
                               hover:bg-blue-600 transition-colors"
                    >
                      Retry
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