"use client";

import React, { useState, useRef, useEffect } from "react";
import { Story } from "@/types/index";
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";

interface EnhancedReelCardProps {
  story: Story;
  isCompact?: boolean;
  isFullscreen?: boolean;
}

const StoryCard: React.FC<EnhancedReelCardProps> = ({
  story,
  isCompact = false,
  isFullscreen = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(!isCompact);
  const [isMuted, setIsMuted] = useState(isCompact);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const containerClasses = isFullscreen
    ? "w-full h-full max-h-full mx-auto bg-black rounded-lg overflow-hidden"
    : isCompact
    ? "w-24 xs:w-32 h-48 aspect-[9/16] bg-white rounded-lg shadow-md overflow-hidden"
    : "w-full h-full bg-white rounded-lg shadow-md overflow-hidden";

  const isTextOnlyStory = !story.fileUrl && story.text;

  return (
    <>
      <div className={`${containerClasses} relative`}>
        {isTextOnlyStory ? (
          <div
            className={`w-full h-full flex items-center justify-center p-6 ${
              story.background || 'bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600'
            }`}
          >
            <div
              className={`${story.textStyle || 'font-sans text-white'} text-center break-words max-w-full ${
                isCompact ? 'text-xs' : isFullscreen ? 'text-2xl' : 'text-lg'
              }`}
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {isCompact && story.text && story.text.length > 30
                ? `${story.text.slice(0, 30)}...`
                : story.text}
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {story.fileType === "image" ? (
              <img
                src={story.fileUrl}
                alt="story"
                className="w-full h-full object-cover"
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

            {story.text && !isCompact && (
              <div
                className={`absolute ${
                  story.textStyle || 'font-sans text-white'
                } backdrop-blur-sm bg-black/30 p-3 rounded-lg max-w-[80%] ${
                  isCompact ? 'text-xs' : isFullscreen ? 'text-lg' : 'text-sm'
                }`}
                style={{
                  left: story.textPosition?.x 
                    ? `${story.textPosition.x}px` 
                    : isCompact ? '8px' : '20px',
                  top: story.textPosition?.y 
                    ? `${story.textPosition.y}px` 
                    : isCompact ? '8px' : '20px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                {isCompact && story.text.length > 30
                  ? `${story.text.slice(0, 30)}...`
                  : story.text}
              </div>
            )}

            {story.fileType === "video" && !isCompact && (
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
          </div>
        )}

        {!isFullscreen && (
          <div
            className={`p-2 absolute bottom-2 left-2 ${
              isCompact ? "space-y-1" : "space-y-2"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1">
                {story.authorId.avatar && (
                  <img
                    src={story.authorId.avatar}
                    alt={story.authorId.username}
                    className={`rounded-full object-cover ${
                      isCompact ? "w-5 h-5" : "w-8 h-8"
                    }`}
                  />
                )}
                <p
                  className={`font-semibold truncate ${
                    isTextOnlyStory ? 'text-white drop-shadow-lg' : 'text-gray-500'
                  } ${isCompact ? "text-xs" : "text-sm"}`}
                  style={isTextOnlyStory ? {
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  } : undefined}
                >
                  {story.authorId.username}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StoryCard;