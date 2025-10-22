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
  const retryCountRef = React.useRef(0);
  const localRetryCountRef = React.useRef(0);
  const maxRetries = 50; // Increased for Itel A16
  const forcePlayIntervalRef = React.useRef<any>(null);
  const forceLocalPlayIntervalRef = React.useRef<any>(null);

  React.useEffect(() => {
    const remoteVideo = remoteVideoRef.current;
    if (!remoteVideo) return;

    console.log("🎬 Setting up ULTRA-AGGRESSIVE remote video monitoring for Itel A16");

    const checkRemoteStream = () => {
      const srcObject = remoteVideo.srcObject as MediaStream;
      
      if (!srcObject) {
        setHasRemoteVideo(false);
        setRemoteStreamInfo("No stream");
        setDebugInfo((prev: any)=> ({ ...prev, remoteError: "No srcObject" }));
        return;
      }

      const videoTracks = srcObject.getVideoTracks();
      const audioTracks = srcObject.getAudioTracks();
      
      const videoTrack = videoTracks[0];
      const hasVideo = videoTrack && videoTrack.readyState === "live" && videoTrack.enabled;

      setHasRemoteVideo(hasVideo);
      setRemoteStreamInfo(
        `Video: ${videoTracks.length}(${videoTrack?.readyState || "none"}) ` +
        `Audio: ${audioTracks.length}(${audioTracks[0]?.readyState || "none"})`
      );
      
      setDebugInfo((prev: any) => ({
        ...prev,
        hasRemoteVideo: hasVideo,
        remoteVideoTracks: videoTracks.length,
        remoteAudioTracks: audioTracks.length,
        remoteTrackReadyState: videoTrack?.readyState,
        remoteTrackEnabled: videoTrack?.enabled,
        remoteVideoPaused: remoteVideo.paused,
        remoteVideoMuted: remoteVideo.muted,
        remoteVideoVolume: remoteVideo.volume,
        remoteReadyState: remoteVideo.readyState,
        remoteNetworkState: remoteVideo.networkState,
        remoteVideoWidth: remoteVideo.videoWidth,
        remoteVideoHeight: remoteVideo.videoHeight,
        remoteCurrentTime: remoteVideo.currentTime?.toFixed(2),
      }));

      if (hasVideo && remoteVideo.paused && retryCountRef.current < maxRetries) {
        console.warn(`⚠️ REMOTE video paused, FORCE PLAY attempt ${retryCountRef.current}`);
        retryCountRef.current++;
        
        remoteVideo.play()
          .then(() => {
            console.log(`✅ REMOTE video FORCE PLAY successful (retry ${retryCountRef.current})`);
            retryCountRef.current = 0;
          })
          .catch(err => {
            console.error(`❌ REMOTE FORCE PLAY retry ${retryCountRef.current} failed:`, err);
          });
      }
      
      // 🔴 CRITICAL: If dimensions exist but paused, force complete reset
      if (hasVideo && remoteVideo.videoWidth > 0 && remoteVideo.videoHeight > 0 && remoteVideo.paused) {
        console.error("❌ REMOTE video has dimensions but PAUSED - FORCING COMPLETE RESET");
        const stream = remoteVideo.srcObject;
        remoteVideo.srcObject = null;
        remoteVideo.load();
        setTimeout(() => {
          remoteVideo.srcObject = stream;
          remoteVideo.play()
            .then(() => console.log("✅ REMOTE video reset successful"))
            .catch(e => console.error("❌ REMOTE reset failed:", e));
        }, 100);
      }
    };

    // Initial check
    checkRemoteStream();

    // Check every 500ms (more aggressive)
    const checkInterval = setInterval(checkRemoteStream, 500);
    
    // 🔴 ULTRA-CRITICAL: FORCE PLAY every 1 second
    forcePlayIntervalRef.current = setInterval(() => {
      if (remoteVideo.srcObject && remoteVideo.paused) {
        console.log("🔄 REMOTE: Continuous FORCE PLAY...");
        remoteVideo.play().catch(() => {});
      }
    }, 1000);

    // 🔴 CRITICAL: All video events
    const handleLoadedMetadata = () => {
      console.log("📥 REMOTE: Video metadata loaded", {
        width: remoteVideo.videoWidth,
        height: remoteVideo.videoHeight,
      });
      checkRemoteStream();
      remoteVideo.play()
        .then(() => console.log("✅ REMOTE: Playing after metadata"))
        .catch(err => console.error("❌ REMOTE: Play after metadata failed:", err));
    };

    const handleLoadedData = () => {
      console.log("📥 REMOTE: Video data loaded");
      checkRemoteStream();
      remoteVideo.play().catch(err => console.error("❌ REMOTE: Play after data failed:", err));
    };

    const handleCanPlay = () => {
      console.log("✅ REMOTE: Video CAN PLAY");
      
      remoteVideo.play()
        .then(() => {
          console.log("✅✅ REMOTE: Video PLAYING after canplay");
          checkRemoteStream();
        })
        .catch((err) => {
          console.error("❌ REMOTE: canplay event play failed:", err);
          
          // Rapid retries
          [100, 300, 500, 1000, 2000, 3000].forEach((delay, index) => {
            setTimeout(() => {
              if (remoteVideo.paused) {
                console.log(`🔄 REMOTE: Rapid retry ${index + 1} (${delay}ms)`);
                remoteVideo.play().catch(e => console.error(`❌ REMOTE: Retry ${index + 1} failed:`, e));
              }
            }, delay);
          });
        });
    };

    const handleCanPlayThrough = () => {
      console.log("✅ REMOTE: Video can play through");
      remoteVideo.play().catch(err => console.error("❌ REMOTE: Play through failed:", err));
    };

    const handlePlaying = () => {
      console.log("✅✅✅ REMOTE: Video is ACTUALLY PLAYING NOW");
      setHasRemoteVideo(true);
      retryCountRef.current = 0;
      checkRemoteStream();
    };

    const handlePause = () => {
      console.warn("⚠️ REMOTE: Video PAUSED unexpectedly - AUTO-RESUMING");
      setTimeout(() => {
        if (remoteVideo.srcObject && remoteVideo.paused) {
          console.log("🔄 REMOTE: AUTO-RESUME from pause");
          remoteVideo.play().catch(err => console.error("❌ REMOTE: Auto-resume failed:", err));
        }
      }, 50);
    };

    const handleWaiting = () => {
      console.log("⏳ REMOTE: Video waiting/buffering");
    };

    const handleStalled = () => {
      console.error("❌ REMOTE: Video STALLED - FORCING RELOAD");
      const src = remoteVideo.srcObject;
      remoteVideo.srcObject = null;
      remoteVideo.load();
      setTimeout(() => {
        remoteVideo.srcObject = src;
        remoteVideo.play().catch(err => console.error("❌ REMOTE: Stall recovery failed:", err));
      }, 200);
    };

    const handleSuspend = () => {
      console.warn("⚠️ REMOTE: Video SUSPENDED - FORCE RESUME");
      remoteVideo.play().catch(err => console.error("❌ REMOTE: Suspend resume failed:", err));
    };

    const handleError = (e: Event) => {
      console.error("❌ REMOTE: Video ERROR:", e);
      const error = (e.target as HTMLVideoElement).error;
      if (error) {
        console.error("❌ REMOTE: Error code:", error.code, "Message:", error.message);
      }
    };

    // Configure remote video
    remoteVideo.muted = true; // MUST be true (audio from separate element)
    remoteVideo.volume = 0;
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    
    // Mobile attributes
    remoteVideo.setAttribute('playsinline', 'true');
    remoteVideo.setAttribute('webkit-playsinline', 'true');
    remoteVideo.setAttribute('x5-playsinline', 'true');
    remoteVideo.setAttribute('x5-video-player-type', 'h5');
    remoteVideo.setAttribute('x5-video-player-fullscreen', 'false');
    remoteVideo.setAttribute('x-webkit-airplay', 'allow');

    // Add event listeners
    remoteVideo.addEventListener("loadedmetadata", handleLoadedMetadata);
    remoteVideo.addEventListener("loadeddata", handleLoadedData);
    remoteVideo.addEventListener("canplay", handleCanPlay);
    remoteVideo.addEventListener("canplaythrough", handleCanPlayThrough);
    remoteVideo.addEventListener("playing", handlePlaying);
    remoteVideo.addEventListener("pause", handlePause);
    remoteVideo.addEventListener("waiting", handleWaiting);
    remoteVideo.addEventListener("stalled", handleStalled);
    remoteVideo.addEventListener("suspend", handleSuspend);
    remoteVideo.addEventListener("error", handleError);

    return () => {
      clearInterval(checkInterval);
      if (forcePlayIntervalRef.current) {
        clearInterval(forcePlayIntervalRef.current);
      }
      remoteVideo.removeEventListener("loadedmetadata", handleLoadedMetadata);
      remoteVideo.removeEventListener("loadeddata", handleLoadedData);
      remoteVideo.removeEventListener("canplay", handleCanPlay);
      remoteVideo.removeEventListener("canplaythrough", handleCanPlayThrough);
      remoteVideo.removeEventListener("playing", handlePlaying);
      remoteVideo.removeEventListener("pause", handlePause);
      remoteVideo.removeEventListener("waiting", handleWaiting);
      remoteVideo.removeEventListener("stalled", handleStalled);
      remoteVideo.removeEventListener("suspend", handleSuspend);
      remoteVideo.removeEventListener("error", handleError);
    };
  }, [remoteVideoRef]);

  // 🔴 CRITICAL: ULTRA-AGGRESSIVE Local Video Monitoring
  React.useEffect(() => {
    const localVideo = localVideoRef.current;
    if (!localVideo) return;

    console.log("🎬 Setting up ULTRA-AGGRESSIVE local video monitoring for Itel A16");

    const checkLocalStream = () => {
      const srcObject = localVideo.srcObject as MediaStream;
      
      if (!srcObject) {
        setHasLocalVideo(false);
        setLocalStreamInfo("No stream");
        return;
      }

      const videoTracks = srcObject.getVideoTracks();
      const audioTracks = srcObject.getAudioTracks();
      
      const videoTrack = videoTracks[0];
      const hasVideo = videoTrack && videoTrack.readyState === "live" && videoTrack.enabled;

      setHasLocalVideo(hasVideo);
      setLocalStreamInfo(
        `Video: ${videoTracks.length}(${videoTrack?.readyState || "none"}) ` +
        `Audio: ${audioTracks.length}(${audioTracks[0]?.readyState || "none"})`
      );
      
      setDebugInfo((prev: any) => ({
        ...prev,
        hasLocalVideo: hasVideo,
        localVideoTracks: videoTracks.length,
        localAudioTracks: audioTracks.length,
        localVideoPaused: localVideo.paused,
        localVideoMuted: localVideo.muted,
        localVideoVolume: localVideo.volume,
        localReadyState: localVideo.readyState,
        localVideoWidth: localVideo.videoWidth,
        localVideoHeight: localVideo.videoHeight,
      }));

      // 🔴 CRITICAL: Local video MUST be muted to prevent echo
      if (localVideo.muted !== true || localVideo.volume !== 0) {
        console.warn("⚠️ LOCAL: Fixing audio settings to prevent echo");
        localVideo.muted = true;
        localVideo.volume = 0;
      }

      // 🔴 CRITICAL: If has video but paused, FORCE PLAY
      if (hasVideo && localVideo.paused && localRetryCountRef.current < maxRetries) {
        console.warn(`⚠️ LOCAL video paused, FORCE PLAY attempt ${localRetryCountRef.current}`);
        localRetryCountRef.current++;
        
        localVideo.play()
          .then(() => {
            console.log(`✅ LOCAL video FORCE PLAY successful (retry ${localRetryCountRef.current})`);
            localRetryCountRef.current = 0;
          })
          .catch((err: any) => {
            console.error(`❌ LOCAL FORCE PLAY retry ${localRetryCountRef.current} failed:`, err);
          });
      }
    };

    // Initial check
    checkLocalStream();

    // Check every 500ms
    const checkInterval = setInterval(checkLocalStream, 500);
    
    // 🔴 ULTRA-CRITICAL: FORCE PLAY every 1 second
    forceLocalPlayIntervalRef.current = setInterval(() => {
      if (localVideo.srcObject && localVideo.paused) {
        console.log("🔄 LOCAL: Continuous FORCE PLAY...");
        localVideo.play().catch(() => {});
      }
    }, 1000);

    // Configure local video
    localVideo.muted = true; // CRITICAL - prevents echo
    localVideo.volume = 0;
    localVideo.autoplay = true;
    localVideo.playsInline = true;
    
    // Event listeners
    const handleLocalPlaying = () => {
      console.log("✅✅✅ LOCAL: Video is PLAYING");
      setHasLocalVideo(true);
      localRetryCountRef.current = 0;
    };

    const handleLocalPause = () => {
      console.warn("⚠️ LOCAL: Video PAUSED - AUTO-RESUMING");
      setTimeout(() => {
        if (localVideo.srcObject && localVideo.paused) {
          localVideo.play().catch(err => console.error("❌ LOCAL: Auto-resume failed:", err));
        }
      }, 50);
    };

    localVideo.addEventListener("playing", handleLocalPlaying);
    localVideo.addEventListener("pause", handleLocalPause);

    return () => {
      clearInterval(checkInterval);
      if (forceLocalPlayIntervalRef.current) {
        clearInterval(forceLocalPlayIntervalRef.current);
      }
      localVideo.removeEventListener("playing", handleLocalPlaying);
      localVideo.removeEventListener("pause", handleLocalPause);
    };
  }, [localVideoRef]);

  // 🔴 CRITICAL: User interaction handler (tap anywhere to force play)
  const handleUserInteraction = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    console.log("👆 USER INTERACTION DETECTED - FORCING ALL VIDEOS TO PLAY");
    e.stopPropagation();
    
    // Force remote video
    if (remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      console.log("👆 REMOTE: Force play on interaction", {
        paused: video.paused,
        srcObject: !!video.srcObject,
        readyState: video.readyState,
      });
      
      if (video.srcObject) {
        video.muted = true; // Keep muted!
        video.play()
          .then(() => {
            console.log("✅✅ REMOTE: Playing after user interaction");
            setHasRemoteVideo(true);
          })
          .catch(err => {
            console.error("❌ REMOTE: Play on interaction failed:", err);
          });
      }
    }

    // Force local video
    if (localVideoRef.current) {
      const video = localVideoRef.current;
      console.log("👆 LOCAL: Force play on interaction");
      
      if (video.srcObject) {
        video.muted = true; // Keep muted!
        video.volume = 0;
        video.play()
          .then(() => {
            console.log("✅✅ LOCAL: Playing after user interaction");
            setHasLocalVideo(true);
          })
          .catch(err => {
            console.error("❌ LOCAL: Play on interaction failed:", err);
          });
      }
    }
  }, [remoteVideoRef, localVideoRef]);

  return (
    <div 
      className="relative w-full h-full bg-black"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onTouchEnd={handleUserInteraction}
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted={true}
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
          transform: "translate3d(0, 0, 0)",
          WebkitTransform: "translate3d(0, 0, 0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          willChange: "transform",
          zIndex: 1,
        }}
      />

      {/* Local video - picture in picture */}
      {!isCallMinimized && (
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg z-10">
          <video
            ref={localVideoRef}
            autoPlay
            muted={true}
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

      {/* 🔴 ENHANCED Debug Panel */}
      <div className="absolute bottom-20 left-2 right-2 bg-black bg-opacity-90 text-white text-xs p-3 rounded z-20 max-h-48 overflow-y-auto">
        <div className="font-bold mb-2 text-yellow-400">🔍 Stream Debug</div>
        
        <div className="mb-2 border-b border-gray-700 pb-2">
          <div className="font-semibold text-green-400">Remote Video:</div>
          <div>{remoteStreamInfo}</div>
          <div>Has Video: {hasRemoteVideo ? "✅" : "❌"}</div>
          <div>Paused: {debugInfo.remoteVideoPaused ? "❌ Yes" : "✅ No"}</div>
          <div>Muted: {debugInfo.remoteVideoMuted ? "✅ Yes" : "❌ No"}</div>
          <div>Volume: {debugInfo.remoteVideoVolume}</div>
          <div>Ready: {debugInfo.remoteReadyState}</div>
          <div>Network: {debugInfo.remoteNetworkState}</div>
          <div>Dimension: {debugInfo.remoteVideoWidth}x{debugInfo.remoteVideoHeight}</div>
          <div>Time: {debugInfo.remoteCurrentTime}s</div>
        </div>

        <div className="mb-2 border-b border-gray-700 pb-2">
          <div className="font-semibold text-blue-400">Local Video:</div>
          <div>{localStreamInfo}</div>
          <div>Has Video: {hasLocalVideo ? "✅" : "❌"}</div>
          <div>Paused: {debugInfo.localVideoPaused ? "❌ Yes" : "✅ No"}</div>
          <div>Muted: {debugInfo.localVideoMuted ? "✅ Yes (Good)" : "❌ No (BAD - Echo!)"}</div>
          <div>Volume: {debugInfo.localVideoVolume}</div>
          <div>Dimension: {debugInfo.localVideoWidth}x{debugInfo.localVideoHeight}</div>
        </div>
        
        <div className="text-yellow-400 font-bold animate-pulse text-center mt-2">
          👆 TAP SCREEN ANYWHERE 👆
        </div>
      </div>

      {/* Video status overlay */}
      {!hasRemoteVideo && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-gray-400 z-5">
          <div className="text-center p-4">
            <Video size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2 font-semibold">Waiting for remote video...</p>
            <p className="text-xs text-gray-500 mb-2">{remoteStreamInfo}</p>
            <p className="text-lg text-yellow-400 mb-3 animate-pulse font-bold">
              👆 TAP SCREEN NOW 👆
            </p>
            <p className="text-xs text-gray-400">
              Keep tapping if video doesn&apos;t appear
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

      {!hasLocalVideo && !isCallMinimized && (
        <div className="absolute top-24 right-4 w-32 bg-red-600 bg-opacity-90 text-white text-xs p-2 rounded z-20">
          ⚠️ Local camera not showing
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