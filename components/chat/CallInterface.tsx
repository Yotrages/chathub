"use client"
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from "lucide-react";
import React from "react";
import { UserAvatar } from "../constant/UserAvatar";

interface CallInterfaceProps {
  callState: string;
  connectionState: string;
  isVideoCall: boolean;
  callError: string | null;
  callDuration: number;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isRemoteAudioMuted: boolean;
  isCallMinimized: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  currentChat: any;
  onToggleAudioMute: () => void;
  onToggleVideoMute: () => void;
  onToggleRemoteAudio: () => void;
  onSwitchCallType: () => void;
  onEndCall: () => void;
  onToggleMinimize: () => void;
  formatDuration: (seconds: number) => string;
  remoteStream: MediaStream | null
}

interface VideoCallDisplay {
  isCallMinimized: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  isVideoMuted: boolean;
    remoteStream: MediaStream | null
}

export const CallInterface = ({
  callState,
  connectionState,
  isVideoCall,
  callError,
  callDuration,
  isAudioMuted,
  isVideoMuted,
  isRemoteAudioMuted,
  isCallMinimized,
  localVideoRef,
  remoteVideoRef,
  currentChat,
  onToggleAudioMute,
  onToggleVideoMute,
  onToggleRemoteAudio,
  onSwitchCallType,
  onEndCall,
  onToggleMinimize,
  formatDuration,
  remoteStream,
}: CallInterfaceProps) => {
  if (callState === "idle") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gray-900 text-white flex flex-col transition-all duration-300 ${
        isCallMinimized
          ? "bottom-0 right-4 left-auto top-auto w-80 h-60 rounded-t-lg shadow-2xl"
          : ""
      }`}
    >
      <CallHeader
        currentChat={currentChat}
        callState={callState}
        connectionState={connectionState}
        callDuration={callDuration}
        isCallMinimized={isCallMinimized}
        onToggleMinimize={onToggleMinimize}
        formatDuration={formatDuration}
      />

      {callError && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm border-l-4 border-red-800">
          <div className="flex items-center">
            <div className="animate-pulse w-2 h-2 bg-red-300 rounded-full mr-2"></div>
            {callError}
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        {isVideoCall ? (
          <VideoCallDisplay
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            isVideoMuted={isVideoMuted}
            isCallMinimized={isCallMinimized}
            remoteStream={remoteStream}
          />
        ) : (
          <AudioCallDisplay
            currentChat={currentChat}
            callState={callState}
            callDuration={callDuration}
            formatDuration={formatDuration}
          />
        )}
      </div>

      {!isCallMinimized && (
        <CallControls
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          isRemoteAudioMuted={isRemoteAudioMuted}
          isVideoCall={isVideoCall}
          callState={callState}
          onToggleAudioMute={onToggleAudioMute}
          onToggleVideoMute={onToggleVideoMute}
          onToggleRemoteAudio={onToggleRemoteAudio}
          onSwitchCallType={onSwitchCallType}
          onEndCall={onEndCall}
        />
      )}
    </div>
  );
};

const CallHeader = ({
  currentChat,
  callState,
  connectionState,
  callDuration,
  isCallMinimized,
  onToggleMinimize,
  formatDuration,
}: any) => (
  <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
    <div className="flex items-center min-w-0">
      <UserAvatar
        username={currentChat?.name}
        avatar={currentChat?.avatar}
        className="w-8 h-8 mr-3 flex-shrink-0"
      />
      <div className="min-w-0">
        <h4 className="font-medium text-white truncate">{currentChat.name}</h4>
        <p className="text-xs text-gray-300">
          {callState === "calling" && (
            <span className="flex items-center">
              <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Calling...
            </span>
          )}
          {callState === "ringing" && (
            <span className="flex items-center">
              <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
              Ringing...
            </span>
          )}
          {callState === "connecting" && (
            <span className="flex items-center">
              <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
              Connecting...
            </span>
          )}
          {callState === "connected" && (
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              {formatDuration(callDuration)}
            </span>
          )}
          {callState === "failed" && (
            <span className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
              Call Failed
            </span>
          )}
          {callState === "ended" && (
            <span className="flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
              Call Ended
            </span>
          )}
        </p>
      </div>
    </div>

    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-300 hidden sm:block">
        {connectionState === "connecting" && "Connecting..."}
        {connectionState === "connected" && "Connected"}
        {connectionState === "disconnected" && (
          <span className="text-yellow-400">Reconnecting...</span>
        )}
        {connectionState === "failed" && (
          <span className="text-red-400">Connection Failed</span>
        )}
      </span>
      <button
        onClick={onToggleMinimize}
        className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
        title={isCallMinimized ? "Maximize call" : "Minimize call"}
      >
        {isCallMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
      </button>
    </div>
  </div>
);

const VideoCallDisplay = ({
  localVideoRef,
  remoteVideoRef,
  isVideoMuted,
  isCallMinimized,
  remoteStream
}: VideoCallDisplay) => {
  const [hasRemoteVideo, setHasRemoteVideo] = React.useState(false);
  const [remoteStreamInfo, setRemoteStreamInfo] = React.useState<string>("");
  const [debugInfo, setDebugInfo] = React.useState<any>({});
  const retryCountRef = React.useRef(0);
  const maxRetries = 20;

  // Replace the current useEffect in VideoCallDisplay with this enhanced version:
    React.useEffect(() => {
  const remoteVideo = remoteVideoRef.current;
  if (!remoteVideo) return;

  // CRITICAL: Reset and force video playback
  const forceVideoPlayback = async () => {
    if (!remoteVideo.srcObject) return;

    try {
      // Stop any current playback
      remoteVideo.pause();
      remoteVideo.srcObject = null;
      
      // Small delay to reset
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reassign stream
      remoteVideo.srcObject = remoteStream;
      remoteVideo.muted = true;
      remoteVideo.volume = 0;
      
      // Force play with multiple attempts
      let attempts = 0;
      const tryPlay = () => {
        remoteVideo.play()
          .then(() => {
            console.log("✅ Video playback successful on attempt", attempts);
          })
          .catch(err => {
            attempts++;
            if (attempts < 5) {
              console.log(`🔄 Retry ${attempts} for video playback`);
              setTimeout(tryPlay, 500);
            } else {
              console.error("❌ All video playback attempts failed:", err);
            }
          });
      };
      
      tryPlay();
    } catch (error) {
      console.error("❌ Error in forceVideoPlayback:", error);
    }
  };

  // Initial attempt
  forceVideoPlayback();

  // Add event listeners for recovery
  const handleError = () => {
    console.log("🔄 Video error detected, attempting recovery...");
    setTimeout(forceVideoPlayback, 1000);
  };

  const handleStalled = () => {
    console.log("🔄 Video stalled, attempting recovery...");
    forceVideoPlayback();
  };

  remoteVideo.addEventListener('error', handleError);
  remoteVideo.addEventListener('stalled', handleStalled);

  return () => {
    remoteVideo.removeEventListener('error', handleError);
    remoteVideo.removeEventListener('stalled', handleStalled);
  };
}, [remoteStream]);

  // CRITICAL: Local video always muted
  React.useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0;
      localVideoRef.current.playsInline = true;
      localVideoRef.current.autoplay = true;
      
      localVideoRef.current.play().catch(err => {
        console.error("Local video play error:", err);
      });
    }
  }, [localVideoRef]);

  // CRITICAL: Global click handler for user interaction
  const handleUserInteraction = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    console.log("👆 User interaction detected");
    e.stopPropagation();
    
    if (remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      
      console.log("Current video state:", {
        paused: video.paused,
        srcObject: !!video.srcObject,
        readyState: video.readyState,
      });
      
      if (video.paused || !hasRemoteVideo) {
        console.log("▶️ Forcing play on user interaction");
        video.play()
          .then(() => {
            console.log("✅✅ Video playing after user interaction");
            setHasRemoteVideo(true);
          })
          .catch(err => {
            console.error("❌ Play on interaction failed:", err);
          });
      }
    }
  }, [remoteVideoRef, hasRemoteVideo]);

  const preventContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
};

  return (
    <div 
      className="relative w-full h-full bg-black"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onTouchEnd={handleUserInteraction}
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Remote video - full screen */}
      <video
        onContextMenu={preventContextMenu}
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        controls={false}
        className="w-full h-full object-cover"
        style={{
          display: "block",
          visibility: "visible",
          opacity: 1,
          backgroundColor: "#000",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "translateZ(0)", // Force hardware acceleration
          WebkitTransform: "translateZ(0)",         
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          perspective: 1000,
          WebkitPerspective: 1000,
          zIndex: 1,
        }}
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Local video - picture in picture */}
      {!isCallMinimized && (
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-scroll border-2 border-gray-600 shadow-lg z-10">
          <video
            ref={localVideoRef}
            onContextMenu={preventContextMenu}
            autoPlay
            muted
            playsInline
            controls={false}
            className="w-full h-full object-cover"
            style={{
              transform: "scaleX(-1)",
            }}
          />
          {isVideoMuted && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff size={20} className="text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Enhanced debug info */}
      <div className="absolute bottom-20 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-20 max-w-xs">
        <div className="font-bold mb-1">Stream Debug:</div>
        <div>{remoteStreamInfo}</div>
        <div>Has Video: {hasRemoteVideo ? "✅" : "❌"}</div>
        <div>Paused: {debugInfo.videoPaused ? "Yes ❌" : "No ✅"}</div>
        <div>Muted: {debugInfo.videoMuted ? "Yes ✅" : "No ❌"}</div>
        <div>Volume: {debugInfo.videoVolume}</div>
        <div>Ready State: {debugInfo.readyState}</div>
        <div>Network State: {debugInfo.networkState}</div>
        <div>Dimensions: {debugInfo.videoWidth}x{debugInfo.videoHeight}</div>
        <div>Current Time: {debugInfo.currentTime?.toFixed(2)}</div>
        <div className="text-yellow-400 mt-1">👆 Tap screen to play</div>
      </div>

      {/* Video status overlay */}
      {!hasRemoteVideo && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-gray-400 z-5">
          <div className="text-center p-4">
            <Video size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2 font-semibold">Waiting for video...</p>
            <p className="text-xs text-gray-500 mb-2">{remoteStreamInfo}</p>
            <p className="text-sm text-yellow-400 mb-3 animate-pulse">
              👆 TAP ANYWHERE ON SCREEN 👆
            </p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AudioCallDisplay = ({
  currentChat,
  callState,
  callDuration,
  formatDuration,
}: any) => (
  <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900">
    <div className="text-center">
      {currentChat?.avatar ? (
        <UserAvatar
          username={currentChat?.name}
          avatar={currentChat?.avatar}
          className="w-24 h-24 mx-auto mb-6 shadow-2xl"
        />
      ) : (
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <span className="text-white text-3xl font-semibold">
            {currentChat.name?.charAt(0) || "U"}
          </span>
        </div>
      )}

      <h3 className="text-2xl font-semibold text-white mb-2">
        {currentChat.name}
      </h3>
      <div className="text-lg text-gray-300">
        {callState === "calling" && (
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span className="ml-2">Calling...</span>
          </div>
        )}
        {callState === "ringing" && (
          <div className="flex items-center justify-center">
            <div className="animate-pulse w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span>Incoming call...</span>
          </div>
        )}
        {callState === "connecting" && (
          <div className="flex items-center justify-center">
            <div className="animate-pulse w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span>Connecting...</span>
          </div>
        )}
        {callState === "connected" && (
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span>Voice call • {formatDuration(callDuration)}</span>
          </div>
        )}
        {(callState === "failed" || callState === "ended") && (
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span>Call {callState}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const CallControls = ({
  isAudioMuted,
  isVideoMuted,
  isRemoteAudioMuted,
  isVideoCall,
  callState,
  onToggleAudioMute,
  onToggleVideoMute,
  onToggleRemoteAudio,
  onSwitchCallType,
  onEndCall,
}: any) => (
  <div className="flex items-center justify-center space-x-4 p-6 bg-gray-800 border-t border-gray-700">
    <button
      onClick={onToggleAudioMute}
      className={`p-4 rounded-full transition-all transform hover:scale-105 ${
        isAudioMuted
          ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
          : "bg-gray-600 hover:bg-gray-500"
      }`}
      title={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
    >
      {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
    </button>

    {isVideoCall && (
      <button
        onClick={onToggleVideoMute}
        className={`p-4 rounded-full transition-all transform hover:scale-105 ${
          isVideoMuted
            ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
            : "bg-gray-600 hover:bg-gray-500"
        }`}
        title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
      >
        {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
      </button>
    )}

    <button
      onClick={onToggleRemoteAudio}
      className={`p-4 rounded-full transition-all transform hover:scale-105 ${
        isRemoteAudioMuted
          ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
          : "bg-gray-600 hover:bg-gray-500"
      }`}
      title={isRemoteAudioMuted ? "Unmute speaker" : "Mute speaker"}
    >
      {isRemoteAudioMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
    </button>

    {callState === "connected" && (
      <button
        onClick={onSwitchCallType}
        className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
        title={isVideoCall ? "Switch to voice call" : "Switch to video call"}
      >
        {isVideoCall ? <Phone size={24} /> : <Video size={24} />}
      </button>
    )}

    <button
      onClick={onEndCall}
      className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-red-500/50"
      title="End call"
    >
      <PhoneOff size={24} />
    </button>
  </div>
);
