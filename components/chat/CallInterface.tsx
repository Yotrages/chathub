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
      {/* <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
        <span className="text-white text-sm font-semibold">
          {currentChat.name?.charAt(0) || 'U'}
        </span>
      </div> */}
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

const VideoCallDisplay = ({ localVideoRef, remoteVideoRef, isVideoMuted, isCallMinimized }: VideoCallDisplay) => {
  const [hasRemoteVideo, setHasRemoteVideo] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<string>('Initializing...');
  const [needsInteraction, setNeedsInteraction] = React.useState(false);

  // CRITICAL: Force video element setup with mobile-specific handling
  React.useEffect(() => {
    const remoteVideo = remoteVideoRef.current;
    if (!remoteVideo) {
      setDebugInfo('No video element');
      return;
    }

    console.log('🎥 Setting up remote video element');

    // CRITICAL: Mobile-specific attributes
    remoteVideo.setAttribute('playsinline', 'true');
    remoteVideo.setAttribute('webkit-playsinline', 'true');
    remoteVideo.setAttribute('autoplay', 'true');
    remoteVideo.muted = true; // Mute video (audio plays via separate element)
    remoteVideo.volume = 0;
    
    const checkAndPlayVideo = async () => {
      const srcObject = remoteVideo.srcObject as MediaStream;
      
      if (!srcObject) {
        setDebugInfo('No stream attached');
        setHasRemoteVideo(false);
        return;
      }

      const videoTracks = srcObject.getVideoTracks();
      const audioTracks = srcObject.getAudioTracks();
      
      console.log('📊 Stream check:', {
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoTrack: videoTracks[0] ? {
          id: videoTracks[0].id,
          label: videoTracks[0].label,
          enabled: videoTracks[0].enabled,
          muted: videoTracks[0].muted,
          readyState: videoTracks[0].readyState
        } : null
      });
      
      const hasVideo = videoTracks.length > 0 && 
                       videoTracks[0].readyState === 'live' && 
                       videoTracks[0].enabled;
      
      setHasRemoteVideo(hasVideo);
      setDebugInfo(
        `Video: ${videoTracks.length} tracks, ` +
        `State: ${videoTracks[0]?.readyState || 'none'}, ` +
        `Enabled: ${videoTracks[0]?.enabled || 'n/a'}`
      );

      if (hasVideo) {
        console.log('✅ Video track is live, attempting to play...');
        
        // CRITICAL: Multiple play attempts for mobile
        try {
          await remoteVideo.play();
          console.log('✅ Video playing successfully');
          setNeedsInteraction(false);
        } catch (err: any) {
          console.error('❌ Video play failed:', err.name, err.message);
          
          if (err.name === 'NotAllowedError' || err.name === 'NotSupportedError') {
            console.log('⚠️ Requires user interaction');
            setNeedsInteraction(true);
          } else {
            // Try again after a delay
            setTimeout(() => {
              remoteVideo.play().catch(e => console.error('Retry failed:', e));
            }, 500);
          }
        }
      }
    };

    // Event handlers
    const handleLoadedMetadata = () => {
      console.log('📥 Video metadata loaded');
      console.log('  Video dimensions:', remoteVideo.videoWidth, 'x', remoteVideo.videoHeight);
      checkAndPlayVideo();
    };

    const handleCanPlay = () => {
      console.log('✅ Video can play');
      checkAndPlayVideo();
    };

    const handlePlaying = () => {
      console.log('▶️ Video is playing!');
      setNeedsInteraction(false);
    };

    const handleLoadedData = () => {
      console.log('📥 Video data loaded');
      checkAndPlayVideo();
    };

    remoteVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    remoteVideo.addEventListener('canplay', handleCanPlay);
    remoteVideo.addEventListener('playing', handlePlaying);
    remoteVideo.addEventListener('loadeddata', handleLoadedData);

    // Initial check
    checkAndPlayVideo();

    // Periodic checks
    const interval = setInterval(checkAndPlayVideo, 2000);

    return () => {
      remoteVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      remoteVideo.removeEventListener('canplay', handleCanPlay);
      remoteVideo.removeEventListener('playing', handlePlaying);
      remoteVideo.removeEventListener('loadeddata', handleLoadedData);
      clearInterval(interval);
    };
  }, [remoteVideoRef]);

  // CRITICAL: Local video always muted
  React.useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0;
      localVideoRef.current.setAttribute('playsinline', 'true');
      localVideoRef.current.setAttribute('webkit-playsinline', 'true');
    }
  }, [localVideoRef]);

  // Handle user tap to enable video
  const handleScreenTap = () => {
    console.log('👆 User tapped screen');
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play()
        .then(() => {
          console.log('✅ Video playing after tap');
          setNeedsInteraction(false);
        })
        .catch(err => console.error('❌ Play after tap failed:', err));
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-black"
      onClick={needsInteraction ? handleScreenTap : undefined}
    >
      {/* Remote video - full screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        controls={false}
        className="w-full h-full object-cover"
        style={{ 
          display: 'block',
          backgroundColor: '#000',
          objectFit: 'cover'
        }}
      />
      
      {/* Local video - picture in picture */}
      {!isCallMinimized && (
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg z-10">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            controls={false}
            className="w-full h-full object-cover"
          />
          {isVideoMuted && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff size={20} className="text-gray-400" />
            </div>
          )}
        </div>
      )}
      
      {/* Debug info - bottom left */}
      <div className="absolute bottom-20 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded max-w-xs">
        <div className="font-mono">{debugInfo}</div>
      </div>
      
      {/* Tap to play overlay */}
      {needsInteraction && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20">
          <div className="text-center p-6 bg-gray-800 rounded-lg">
            <Video size={48} className="mx-auto mb-4 text-blue-400" />
            <p className="text-white text-lg font-semibold mb-2">Tap to Start Video</p>
            <p className="text-gray-300 text-sm">Tap anywhere on the screen</p>
          </div>
        </div>
      )}
      
      {/* Loading overlay when no video */}
      {!hasRemoteVideo && !needsInteraction && (
        <div className="absolute inset-0 bg-pink-900 flex items-center justify-center text-white">
          <div className="text-center p-4">
            <Video size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-semibold mb-2">Loading Video...</p>
            <p className="text-sm text-gray-300 mb-4">{debugInfo}</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
  onEndCall
}: any) => (
  <div className="flex items-center justify-center space-x-4 p-6 bg-gray-800 border-t border-gray-700">
    <button
      onClick={onToggleAudioMute}
      className={`p-4 rounded-full transition-all transform hover:scale-105 ${
        isAudioMuted 
          ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' 
          : 'bg-gray-600 hover:bg-gray-500'
      }`}
      title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
    >
      {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
    </button>

    {isVideoCall && (
      <button
        onClick={onToggleVideoMute}
        className={`p-4 rounded-full transition-all transform hover:scale-105 ${
          isVideoMuted 
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' 
            : 'bg-gray-600 hover:bg-gray-500'
        }`}
        title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
      >
        {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
      </button>
    )}

    <button
      onClick={onToggleRemoteAudio}
      className={`p-4 rounded-full transition-all transform hover:scale-105 ${
        isRemoteAudioMuted 
          ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' 
          : 'bg-gray-600 hover:bg-gray-500'
      }`}
      title={isRemoteAudioMuted ? 'Unmute speaker' : 'Mute speaker'}
    >
      {isRemoteAudioMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
    </button>

    {callState === 'connected' && (
      <button
        onClick={onSwitchCallType}
        className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
        title={isVideoCall ? 'Switch to voice call' : 'Switch to video call'}
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
