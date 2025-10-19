"use client";
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
}

interface VideoCallDisplay {
  isCallMinimized: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  isVideoMuted: boolean;
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

export const VideoCallDisplay = ({
  localVideoRef,
  remoteVideoRef,
  isVideoMuted,
  isCallMinimized,
}: VideoCallDisplay) => {
  const [hasRemoteVideo, setHasRemoteVideo] = React.useState(false);
  const [remoteStreamInfo, setRemoteStreamInfo] = React.useState<string>("");
  const [forceUpdate, setForceUpdate] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const remoteVideo = remoteVideoRef.current;
    if (!remoteVideo) return;

    const checkStream = () => {
      const srcObject = remoteVideo.srcObject as MediaStream;
      if (!srcObject) {
        setHasRemoteVideo(false);
        setRemoteStreamInfo("No stream");
        return;
      }

      const videoTracks = srcObject.getVideoTracks();
      const audioTracks = srcObject.getAudioTracks();

      const hasVideo =
        videoTracks.length > 0 &&
        videoTracks[0].readyState === "live" &&
        videoTracks[0].enabled;

      setHasRemoteVideo(hasVideo);
      setRemoteStreamInfo(
        `Video: ${videoTracks.length}(${videoTracks[0]?.readyState || "none"}) ` +
        `Audio: ${audioTracks.length}(${audioTracks[0]?.readyState || "none"})`
      );

      // Force play if paused
      if (hasVideo && remoteVideo.paused) {
        console.log("⚠️ Video paused, forcing play");
        remoteVideo.play().catch(err => console.error("Force play error:", err));
      }
      
      // CRITICAL: Force re-render if video not visible (Itel A16 bug)
      if (hasVideo && remoteVideo.videoWidth > 0 && remoteVideo.videoHeight > 0 && !remoteVideo.paused) {
        // Video is playing but might not be rendering - force update
        setForceUpdate(prev => prev + 1);
      }
    };

    checkStream();

    const handleLoadedMetadata = () => {
      console.log("📥 Video metadata loaded");
      console.log("Video dimensions:", remoteVideo.videoWidth, "x", remoteVideo.videoHeight);
      checkStream();
      
      // Force layout recalculation
      if (containerRef.current) {
        containerRef.current.style.display = 'none';
        void containerRef.current.offsetHeight; // Force reflow
        containerRef.current.style.display = 'block';
      }
    };

    const handleCanPlay = () => {
      console.log("✅ Video can play");
      remoteVideo.play()
        .then(() => {
          console.log("✅ Playing");
          checkStream();
          // Force another layout recalculation after play
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.style.display = 'none';
             void containerRef.current.offsetHeight;
              containerRef.current.style.display = 'block';
            }
          }, 100);
        })
        .catch((err) => {
          console.error("Play error:", err);
          const enablePlay = () => {
            console.log("👆 User tapped, playing video");
            remoteVideo.play();
            document.removeEventListener("touchstart", enablePlay);
            document.removeEventListener("click", enablePlay);
          };
          document.addEventListener("touchstart", enablePlay, { once: true });
          document.addEventListener("click", enablePlay, { once: true });
        });
      checkStream();
    };

    const handlePlaying = () => {
      console.log("✅✅ Video is PLAYING");
      setHasRemoteVideo(true);
      
      // CRITICAL: Force multiple re-renders for stubborn Android devices
      setTimeout(() => setForceUpdate(prev => prev + 1), 100);
      setTimeout(() => setForceUpdate(prev => prev + 1), 500);
      setTimeout(() => setForceUpdate(prev => prev + 1), 1000);
    };

    // CRITICAL: Remote video MUST be muted
    remoteVideo.muted = true;
    remoteVideo.volume = 0;

    remoteVideo.addEventListener("loadedmetadata", handleLoadedMetadata);
    remoteVideo.addEventListener("canplay", handleCanPlay);
    remoteVideo.addEventListener("playing", handlePlaying);

    const interval = setInterval(checkStream, 2000);
    
    // CRITICAL: Aggressive play loop for Itel A16
    const playInterval = setInterval(() => {
      if (remoteVideo.srcObject && remoteVideo.paused) {
        console.log("🔄 Auto-playing paused video");
        remoteVideo.play().catch(() => {});
      }
    }, 3000);

    return () => {
      remoteVideo.removeEventListener("loadedmetadata", handleLoadedMetadata);
      remoteVideo.removeEventListener("canplay", handleCanPlay);
      remoteVideo.removeEventListener("playing", handlePlaying);
      clearInterval(interval);
      clearInterval(playInterval);
    };
  }, [remoteVideoRef, forceUpdate]);

  // CRITICAL: Local video always muted
  React.useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0;
      localVideoRef.current.play().catch(err => {
        console.error("Local video play error:", err);
      });
    }
  }, [localVideoRef]);

  // User interaction handler with force re-render
  const handleUserInteraction = () => {
    console.log("👆 User interaction detected");
    if (remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      
      if (video.paused) {
        video.play().catch(err => console.error("Play error:", err));
      }
      
      // CRITICAL: Force layout recalculation on tap (Itel A16)
      if (containerRef.current) {
        const container = containerRef.current;
        container.style.display = 'none';
        void container.offsetHeight; 
        container.style.display = 'block';
        
        // Force video element update
        video.style.display = 'none';
        void video.offsetHeight;
        video.style.display = 'block';
        
        setForceUpdate(prev => prev + 1);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onTouchEnd={handleUserInteraction}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000',
        // CRITICAL: Force new stacking context
        isolation: 'isolate',
      }}
    >
      {/* CRITICAL: Remote video with aggressive rendering forces */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        controls={false}
        key={`remote-video-${forceUpdate}`} // Force re-render
        style={{
          // CRITICAL: Absolute positioning
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'cover',
          backgroundColor: '#000',
          // CRITICAL: Force display
          display: 'block !important' as any,
          visibility: 'visible !important' as any,
          opacity: '1 !important' as any,
          // CRITICAL: Z-index ABOVE background
          zIndex: 1,
          // CRITICAL: Hardware acceleration
          transform: 'translate3d(0, 0, 0) scale(1)',
          WebkitTransform: 'translate3d(0, 0, 0) scale(1)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform, opacity',
          // CRITICAL: Force GPU rendering
          imageRendering: 'auto',
          // CRITICAL: Prevent optimization
          pointerEvents: 'auto',
        }}
      />

      {/* Local video - picture in picture */}
      {!isCallMinimized && (
        <div 
          className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg"
          style={{ zIndex: 10 }}
        >
          <video
            ref={localVideoRef}
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

      {/* Debug info */}
      <div 
        className="absolute bottom-20 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono"
        style={{ zIndex: 20 }}
      >
        <div>{remoteStreamInfo}</div>
        <div>Has Video: {hasRemoteVideo ? "✅" : "❌"}</div>
        <div>Paused: {remoteVideoRef.current?.paused ? "Yes ❌" : "No ✅"}</div>
        <div>Muted: {remoteVideoRef.current?.muted ? "Yes ✅" : "No ❌"}</div>
        <div>Volume: {remoteVideoRef.current?.volume}</div>
        <div>Ready State: {remoteVideoRef.current?.readyState}</div>
        <div>Network State: {remoteVideoRef.current?.networkState}</div>
        <div>Dimensions: {remoteVideoRef.current?.videoWidth}x{remoteVideoRef.current?.videoHeight}</div>
        <div>Current Time: {remoteVideoRef.current?.currentTime?.toFixed(2)}</div>
        <div className="text-yellow-400 mt-1">Renders: {forceUpdate}</div>
      </div>

      {/* CRITICAL: Pink overlay ONLY when NO video, z-index BELOW video */}
      {!hasRemoteVideo && (
        <div 
          className="absolute inset-0 bg-pink-600 flex items-center justify-center text-white"
          style={{ 
            zIndex: 0, // BELOW video
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <div className="text-center p-4">
            <Video size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="mb-2 text-lg font-semibold">Waiting for video...</p>
            <p className="text-xs mb-3">{remoteStreamInfo}</p>
            <p className="text-base text-yellow-200 animate-pulse font-bold">
              👆 TAP SCREEN MULTIPLE TIMES 👆
            </p>
            <p className="text-sm text-gray-200 mt-2">
              Keep tapping until video appears
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
