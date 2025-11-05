"use client";

import React, { useState, useRef, useEffect } from "react";
import { Story } from "@/types/index";
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";


interface EnhancedReelCardProps {
  story: Story;
  onLike?: (reelId: string) => void;
  onReaction?: (reelId: string, emoji: string) => void;
  isCompact?: boolean;
  isFullscreen?: boolean;
}

const StoryCard: React.FC<EnhancedReelCardProps> = ({
  story,
  // onLike,
  // onReaction,
  isCompact = false,
  isFullscreen = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(!isCompact);
  const [isMuted, setIsMuted] = useState(isCompact);
  const videoRef = useRef<HTMLVideoElement>(null);

  // const isOwner = user?._id === story.authorId._id;

  useEffect(() => {
    const video = videoRef.current;
    if (video && story.fileType === "video") {
      video.muted = isMuted;
    }
  }, [isMuted, story.fileType]);

  const togglePlay = () => {
    if (story.fileType === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  // const handleEmojiSelect = (emoji: string) => {
  //   if (onReaction) {
  //     onReaction(story._id, emoji);
  //   }
  // };

  // const handleViewersClick = () => {
  //   if (isOwner && story.viewers) {
  //     setShowViewers(true);
  //   }
  // };

  const containerClasses = isFullscreen
    ? "w-full h-full max-h-full mx-auto bg-black rounded-lg overflow-hidden"
    : isCompact
    ? "w-24 xs:w-32 h-48 aspect-[9/16] bg-white rounded-lg shadow-md overflow-hidden"
    : "w-full h-full bg-white rounded-lg shadow-md overflow-hidden";

  return (
    <>
      <div className={`${containerClasses} relative`}>
        {/* Media Container */}
        <div
          className={`relative ${
            isCompact ? "w-full max-h-full" : "w-full max-h-full"
          }`}
        >
          {story.fileType === "image" ? (
            <img
              src={story.fileUrl}
              alt="story"
              className="w-full max-h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={story.fileUrl}
              className="w-full h-full object-cover"
              muted={isMuted}
              playsInline
              autoPlay={!isCompact}
              loop
              onClick={togglePlay}
            />
          )}

          {/* Text Overlay */}
          {isFullscreen && story.text && (
            <div
              className={`absolute bg-black ${story.textStyle} bg-opacity-70 p-2 rounded-lg max-w-[80%] ${
                isCompact ? "text-xs" : "text-sm"
              }`}
              style={{
                left: `${story.textPosition?.x || 20}px`,
                top: `${story.textPosition?.y || 20}px`,
              }}
            >
              {isCompact && story.text.length > 30
                ? `${story.text.slice(0, 30)}...`
                : story.text}
            </div>
          )}

          {/* Volume Control for Video */}
          {story.fileType === "video" && !isCompact && (
            <button
              onClick={toggleMute}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-5 w-5" />
              ) : (
                <SpeakerWaveIcon className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Fullscreen Actions */}
          {/* {isFullscreen && (
            <div className="fixed inset-0 z-40 bottom-0 min-w-full flex items-center overflow-x-scroll gap-3">
              <button
                  onClick={handleViewersClick}
                  className="flex items-center space-x-1"
                >
                  <EyeIcon className={`h-4 w-4 text-gray-500 ${isCompact ? '' : 'h-5 w-5'}`} />
                  <span className={isCompact ? 'text-xs' : 'text-sm'}>{story.viewersCount}</span>
                </button>
              <div className="flex space-x-2">
                <EmojiReactions onEmojiSelect={handleEmojiSelect} />
              </div>
            </div>
          )} */}
        </div>

        {/* Compact/Regular Info */}
        {!isFullscreen && (
          <div className={`p-2 absolute bottom-2 left-2 ${isCompact ? "space-y-1" : "space-y-2"}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1">
                {story.authorId.avatar && (
                <img
                  src={story.authorId.avatar}
                  alt={story.authorId.username}
                  className={`rounded-full ${
                    isCompact ? "w-5 h-5" : "w-8 h-8"
                  }`}
                />
                )}
                <p
                  className={`font-semibold truncate text-gray-500 ${
                    isCompact ? "text-xs" : "text-sm"
                  }`}
                >
                  {story.authorId.username}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Viewers Modal */}
      {/* {showViewers && story.viewers && (
        <ReelViewers
          reelId={story._id}
          viewers={story.viewers}
          viewersCount={story.viewersCount}
          isOwner={isOwner}
          onClose={() => setShowViewers(false)}
        />
      )} */}
    </>
  );
};

export default StoryCard;
