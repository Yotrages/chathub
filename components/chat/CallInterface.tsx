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

const VideoCallDisplay = ({
  localVideoRef,
  remoteVideoRef,
  isVideoMuted,
  isCallMinimized,
}: VideoCallDisplay) => {
  const [hasRemoteVideo, setHasRemoteVideo] = React.useState(false);
  const [hasLocalVideo, setHasLocalVideo] = React.useState(false);
  const [remoteStreamInfo, setRemoteStreamInfo] = React.useState<string>("");
  const [localStreamInfo, setLocalStreamInfo] = React.useState<string>("");
  const [debugInfo, setDebugInfo] = React.useState<any>({});

  // Monitor REMOTE video
  React.useEffect(() => {
    const remoteVideo = remoteVideoRef.current;
    if (!remoteVideo) return;

    const checkRemoteStream = () => {
      const srcObject = remoteVideo.srcObject as MediaStream;

      if (!srcObject) {
        setHasRemoteVideo(false);
        setRemoteStreamInfo("No stream");
        return;
      }

      const videoTracks = srcObject.getVideoTracks();
      const audioTracks = srcObject.getAudioTracks();
      const videoTrack = videoTracks[0];
      const hasVideo =
        videoTrack && videoTrack.readyState === "live" && videoTrack.enabled;

      setHasRemoteVideo(hasVideo);
      setRemoteStreamInfo(
        `Video: ${videoTracks.length}(${videoTrack?.readyState || "none"}) ` +
          `Audio: ${audioTracks.length}(${audioTracks[0]?.readyState || "none"})`
      );

      setDebugInfo({
        hasVideo,
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoPaused: remoteVideo.paused,
        videoMuted: remoteVideo.muted,
        videoVolume: remoteVideo.volume,
        readyState: remoteVideo.readyState,
        videoWidth: remoteVideo.videoWidth,
        videoHeight: remoteVideo.videoHeight,
        currentTime: remoteVideo.currentTime,
      });

      // Auto-play if paused
      if (hasVideo && remoteVideo.paused) {
        remoteVideo.play().catch(() => {});
      }
    };

    checkRemoteStream();
    const interval = setInterval(checkRemoteStream, 1000);

    // Aggressive auto-play
    const playInterval = setInterval(() => {
      if (remoteVideo.srcObject && remoteVideo.paused) {
        remoteVideo.play().catch(() => {});
      }
    }, 2000);

    // Event listeners for remote video
    const handleCanPlay = () => {
      remoteVideo.play().catch(() => {});
    };

    const handlePlaying = () => {
      setHasRemoteVideo(true);
    };

    remoteVideo.addEventListener("canplay", handleCanPlay);
    remoteVideo.addEventListener("playing", handlePlaying);

    return () => {
      clearInterval(interval);
      clearInterval(playInterval);
      remoteVideo.removeEventListener("canplay", handleCanPlay);
      remoteVideo.removeEventListener("playing", handlePlaying);
    };
  }, [remoteVideoRef]);

  // CRITICAL: Monitor LOCAL video separately for Itel A16
  React.useEffect(() => {
    const localVideo = localVideoRef.current;
    if (!localVideo) return;

    const checkLocalStream = () => {
      const srcObject = localVideo.srcObject as MediaStream;

      if (!srcObject) {
        setHasLocalVideo(false);
        setLocalStreamInfo("No local stream");
        return;
      }

      const videoTracks = srcObject.getVideoTracks();
      const videoTrack = videoTracks[0];
      const hasVideo =
        videoTrack && videoTrack.readyState === "live" && videoTrack.enabled;

      setHasLocalVideo(hasVideo);
      setLocalStreamInfo(
        `Local: ${videoTracks.length}(${videoTrack?.readyState || "none"})`
      );

      // CRITICAL: Force play if paused (for Itel A16)
      if (hasVideo && localVideo.paused) {
        console.warn("⚠️ Local video paused! Force playing...");
        localVideo.play().catch((err) => {
          console.error("❌ Local video play failed:", err);
        });
      }
    };

    // Check immediately
    checkLocalStream();
    
    // Check every second
    const interval = setInterval(checkLocalStream, 1000);

    // CRITICAL: Aggressive auto-play for local video (Itel A16)
    const playInterval = setInterval(() => {
      if (localVideo.srcObject && localVideo.paused) {
        console.log("🔄 Auto-playing paused local video");
        localVideo.play().catch(() => {});
      }
    }, 1500);

    // Event listeners
    const handleLoadedMetadata = () => {
      console.log("📹 Local video metadata loaded");
      localVideo.play().catch((err: any) => {
        console.error("Local play after metadata failed:", err);
      });
    };

    const handleCanPlay = () => {
      console.log("✅ Local video can play");
      localVideo.play().catch((err) => {
        console.error("Local play after canplay failed:", err);
      });
    };

    const handlePlaying = () => {
      console.log("✅✅ Local video IS PLAYING");
      setHasLocalVideo(true);
    };

    const handlePause = () => {
      console.warn("⚠️ Local video paused unexpectedly!");
      setTimeout(() => {
        if (localVideo.srcObject && localVideo.paused) {
          localVideo.play().catch(() => {});
        }
      }, 100);
    };

    localVideo.addEventListener("loadedmetadata", handleLoadedMetadata);
    localVideo.addEventListener("canplay", handleCanPlay);
    localVideo.addEventListener("playing", handlePlaying);
    localVideo.addEventListener("pause", handlePause);

    return () => {
      clearInterval(interval);
      clearInterval(playInterval);
      localVideo.removeEventListener("loadedmetadata", handleLoadedMetadata);
      localVideo.removeEventListener("canplay", handleCanPlay);
      localVideo.removeEventListener("playing", handlePlaying);
      localVideo.removeEventListener("pause", handlePause);
    };
  }, [localVideoRef]);

  // CRITICAL: Tap handler to force BOTH videos to play
  const handleUserInteraction = React.useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("👆 User tapped - forcing BOTH videos to play");

      // Force remote video
      if (remoteVideoRef.current) {
        const remote = remoteVideoRef.current;
        console.log("▶️ Forcing remote video play");
        remote.play()
          .then(() => console.log("✅ Remote playing"))
          .catch((err: any) => console.error("❌ Remote failed:", err));
      }

      // Force local video (CRITICAL for Itel A16)
      if (localVideoRef.current) {
        const local = localVideoRef.current;
        console.log("▶️ Forcing LOCAL video play");
        local.play()
          .then(() => {
            console.log("✅✅ LOCAL video playing");
            setHasLocalVideo(true);
          })
          .catch((err) => console.error("❌ LOCAL failed:", err));
      }

      // Multiple retries
      [200, 500, 1000, 2000].forEach((delay) => {
        setTimeout(() => {
          if (remoteVideoRef.current?.paused) {
            remoteVideoRef.current.play().catch(() => {});
          }
          if (localVideoRef.current?.paused) {
            localVideoRef.current.play().catch(() => {});
          }
        }, delay);
      });
    },
    [remoteVideoRef, localVideoRef]
  );

  return (
    <div
      className="relative w-full h-full bg-black"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onTouchEnd={handleUserInteraction}
      style={{
        touchAction: "manipulation",
      }}
    >
      {/* Remote video - full screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        controls={false}
        onClick={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        className="w-full h-full object-cover bg-black"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Local video - picture in picture */}
      {!isCallMinimized && (
        <div 
          className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg z-10"
          onClick={handleUserInteraction}
          onTouchStart={handleUserInteraction}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            controls={false}
            onClick={handleUserInteraction}
            onTouchStart={handleUserInteraction}
            className="w-full h-full object-cover"
            style={{
              transform: "scaleX(-1)",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {isVideoMuted && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff size={20} className="text-gray-400" />
            </div>
          )}
          {!hasLocalVideo && !isVideoMuted && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center text-xs">
                <Video size={16} className="mx-auto mb-1 text-gray-500" />
                <div className="text-yellow-400 font-bold">TAP ME</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug info */}
      <div className="absolute bottom-20 left-4 bg-black bg-opacity-90 text-white text-xs p-3 rounded z-20 max-w-xs font-mono">
        <div className="font-bold mb-2 text-yellow-400">🔍 Remote:</div>
        <div className="space-y-1 mb-3">
          <div>{remoteStreamInfo}</div>
          <div>Playing: {debugInfo.videoPaused ? "❌ No" : "✅ Yes"}</div>
          <div className={debugInfo.videoMuted ? "text-red-400" : "text-green-400"}>
            Muted: {debugInfo.videoMuted ? "Yes (No Audio!)" : "No (Audio OK)"}
          </div>
          <div className={debugInfo.videoVolume === 0 ? "text-red-400" : "text-green-400"}>
            Volume: {debugInfo.videoVolume} {debugInfo.videoVolume === 0 && "(No Audio!)"}
          </div>
          <div className="text-blue-400">
            Size: {debugInfo.videoWidth}x{debugInfo.videoHeight}
          </div>
        </div>
        <div className="font-bold mb-1 text-green-400">📹 Local:</div>
        <div className="space-y-1">
          <div>{localStreamInfo}</div>
          <div>Visible: {hasLocalVideo ? "✅ Yes" : "❌ No"}</div>
        </div>
        {(!hasRemoteVideo || !hasLocalVideo) && (
          <div className="text-yellow-400 mt-3 font-bold animate-pulse text-center">
            👆 TAP SCREEN 👆
          </div>
        )}
      </div>

      {/* Video status overlay */}
      {!hasRemoteVideo && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
          <div
            className="text-center p-6"
            onClick={handleUserInteraction}
            onTouchStart={handleUserInteraction}
          >
            <Video size={64} className="mx-auto mb-4 text-blue-400 animate-pulse" />
            <p className="text-xl font-bold mb-3">Waiting for video...</p>
            <div className="bg-yellow-500 text-black px-8 py-4 rounded-lg font-bold text-xl mb-4 animate-bounce">
              👆 TAP HERE 👆
            </div>
            <p className="text-sm text-gray-400">Keep tapping until video shows</p>
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