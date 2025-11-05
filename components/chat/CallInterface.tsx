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
import React, { useState } from "react";
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
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>; // ✅ NEW
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
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>; // ✅ NEW
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
  remoteAudioRef, 
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
            remoteAudioRef={remoteAudioRef} 
            isVideoMuted={isVideoMuted}
            isCallMinimized={isCallMinimized}
          />
        ) : (
          <AudioCallDisplay
            currentChat={currentChat}
            callState={callState}
            callDuration={callDuration}
            formatDuration={formatDuration}
            remoteAudioRef={remoteAudioRef} 
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
  remoteAudioRef, 
  isVideoMuted,
  isCallMinimized,
}: VideoCallDisplay) => {
  const [hasRemoteVideo, setHasRemoteVideo] = React.useState(false);
  const [remoteStreamInfo, setRemoteStreamInfo] = React.useState<string>("");
  const [audioPlaying, setAudioPlaying] = React.useState(false);
  const [bigScreen, setBigScreen] = useState<'remote' | 'local'>('remote'); // Fixed: 'remote' by default
  const retryCountRef = React.useRef(0);
  const maxRetries = 20;

  // 🔴 Monitor audio element
  React.useEffect(() => {
    const audioElement = remoteAudioRef.current;
    if (!audioElement) return;

    const handleAudioPlay = () => {
      console.log("✅ Audio playing");
      setAudioPlaying(true);
    };

    const handleAudioPause = () => {
      console.log("⚠️ Audio paused");
      setAudioPlaying(false);
    };

    audioElement.addEventListener("playing", handleAudioPlay);
    audioElement.addEventListener("pause", handleAudioPause);

    return () => {
      audioElement.removeEventListener("playing", handleAudioPlay);
      audioElement.removeEventListener("pause", handleAudioPause);
    };
  }, [remoteAudioRef]);

  // Video monitoring (unchanged, but ensure video is MUTED)
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
      const videoTrack = videoTracks[0];
      const hasVideo = videoTrack && videoTrack.readyState === "live" && videoTrack.enabled;

      setHasRemoteVideo(hasVideo);
      setRemoteStreamInfo(`Video: ${videoTracks.length}(${videoTrack?.readyState || "none"})`);

      if (hasVideo && remoteVideo.paused && retryCountRef.current < maxRetries) {
        console.warn(`⚠️ Video paused (retry ${retryCountRef.current})`);
        retryCountRef.current++;
        
        remoteVideo.play()
          .then(() => {
            console.log(`✅ Video played on retry ${retryCountRef.current}`);
            retryCountRef.current = 0;
          })
          .catch(err => {
            console.error(`❌ Play retry ${retryCountRef.current} failed:`, err);
          });
      }
    };

    checkStream();
    const checkInterval = setInterval(checkStream, 1000);
    
    const playInterval = setInterval(() => {
      if (remoteVideo.srcObject && remoteVideo.paused) {
        remoteVideo.play().catch(() => {});
      }
    }, 2000);

    // 🔴 CRITICAL: Video element MUST be muted
    remoteVideo.muted = true;
    remoteVideo.volume = 0;
    remoteVideo.playsInline = true;
    remoteVideo.autoplay = true;
    
    remoteVideo.setAttribute('playsinline', 'true');
    remoteVideo.setAttribute('webkit-playsinline', 'true');

    const handleCanPlay = () => {
      remoteVideo.play()
        .then(() => console.log("✅ Video playing"))
        .catch((err) => console.error("❌ Play error:", err));
    };

    remoteVideo.addEventListener("canplay", handleCanPlay);

    return () => {
      clearInterval(checkInterval);
      clearInterval(playInterval);
      remoteVideo.removeEventListener("canplay", handleCanPlay);
    };
  }, [remoteVideoRef]);

  // Local video always muted
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

  // User interaction to start audio
  const handleUserInteraction = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    // Try to play audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play()
        .then(() => console.log("✅ Audio playing after user interaction"))
        .catch(err => console.error("❌ Audio play failed:", err));
    }
    
    // Try to play video
    if (remoteVideoRef.current && remoteVideoRef.current.paused) {
      remoteVideoRef.current.play()
        .then(() => console.log("✅ Video playing after user interaction"))
        .catch(err => console.error("❌ Video play failed:", err));
    }
  }, [remoteAudioRef, remoteVideoRef]);

  const toggleBigScreen = () => {
    setBigScreen(prev => prev === 'remote' ? 'local' : 'remote');
  };

  const bigScreenRef = bigScreen === 'remote' ? remoteVideoRef : localVideoRef;
  const smallScreenRef = bigScreen === 'remote' ? localVideoRef : remoteVideoRef;

 return (
    <div 
      className="relative w-full h-full bg-black"
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <video
        ref={bigScreenRef}
        autoPlay
        playsInline
        muted 
        controls={false}
        className="w-full h-full object-cover"
        style={{
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#000",
          transform: bigScreen === 'local' ? 'scaleX(-1)' : 'none',
        }}
      />

      {!isCallMinimized && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleBigScreen();
          }}
          className="absolute top-4 right-4 w-36 h-full max-h-[30vh] bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg z-10 cursor-pointer hover:border-blue-500 transition-colors"
        >
          <video
            ref={smallScreenRef}
            autoPlay
            muted
            playsInline
            controls={false}
            className="w-full h-full object-cover"
            style={{
              transform: bigScreen === 'remote' ? 'scaleX(-1)' : 'none',
            }}
          />
          {bigScreen === 'remote' && isVideoMuted && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff size={20} className="text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            👆 Tap to swap
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded z-20">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${audioPlaying ? 'bg-green-400' : 'bg-red-400'}`}></div>
          Audio: {audioPlaying ? "Playing ✅" : "Waiting ⏳"}
        </div>
        <div className="mt-1">{remoteStreamInfo}</div>
        <div className="mt-1 text-yellow-400">
          Big: {bigScreen === 'remote' ? 'Remote' : 'You'}
        </div>
        {!audioPlaying && (
          <div className="text-yellow-400 mt-1">👆 Tap to start</div>
        )}
      </div>

      {!hasRemoteVideo && bigScreen === 'remote' && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-gray-400">
          <div className="text-center p-4">
            <VideoOff size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-2 font-semibold">Waiting for video...</p>
            <p className="text-sm text-yellow-400 animate-pulse">
              👆 TAP SCREEN 👆
            </p>
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
  remoteAudioRef, 
}: any) => {
  const [audioPlaying, setAudioPlaying] = React.useState(false);

  React.useEffect(() => {
    const audioElement = remoteAudioRef.current;
    if (!audioElement) return;

    const handleAudioPlay = () => {
      setAudioPlaying(true);
    };

    const handleAudioPause = () => {
      setAudioPlaying(false);
    };

    audioElement.addEventListener("playing", handleAudioPlay);
    audioElement.addEventListener("pause", handleAudioPause);

    return () => {
      audioElement.removeEventListener("playing", handleAudioPlay);
      audioElement.removeEventListener("pause", handleAudioPause);
    };
  }, [remoteAudioRef]);

  return (
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
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span>Voice call • {formatDuration(callDuration)}</span>
              </div>
              {/* Audio status */}
              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${audioPlaying ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                <span className="text-gray-400">
                  {audioPlaying ? "Audio connected" : "Connecting audio..."}
                </span>
              </div>
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
};

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