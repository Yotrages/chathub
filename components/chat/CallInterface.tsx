import { Maximize2, Minimize2, Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';

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
  formatDuration
}: CallInterfaceProps) => {
  if (callState === 'idle') return null;

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      isCallMinimized ? 'h-16' : isVideoCall ? 'h-80' : 'h-32'
    }`}>
      <CallHeader
        currentChat={currentChat}
        callState={callState}
        connectionState={connectionState}
        callDuration={callDuration}
        isCallMinimized={isCallMinimized}
        onToggleMinimize={onToggleMinimize}
        formatDuration={formatDuration}
      />

      {!isCallMinimized && (
        <>
          {callError && (
            <div className="bg-red-600 text-white px-4 py-2 text-sm">
              {callError}
            </div>
          )}

          {isVideoCall ? (
            <VideoCallDisplay
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
              isVideoMuted={isVideoMuted}
            />
          ) : (
            <AudioCallDisplay
              currentChat={currentChat}
              callState={callState}
              callDuration={callDuration}
              formatDuration={formatDuration}
            />
          )}

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
        </>
      )}
    </div>
  );
};

const CallHeader = ({ currentChat, callState, connectionState, callDuration, isCallMinimized, onToggleMinimize, formatDuration }: any) => (
  <div className="flex items-center justify-between p-4 bg-gray-800">
    <div className="flex items-center">
      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
        <span className="text-white text-sm font-semibold">
          {currentChat.name?.charAt(0) || 'U'}
        </span>
      </div>
      <div>
        <h4 className="font-medium">{currentChat.name}</h4>
        <p className="text-xs text-gray-300">
          {callState === 'calling' && 'Calling...'}
          {callState === 'ringing' && 'Ringing...'}
          {callState === 'connected' && formatDuration(callDuration)}
          {callState === 'failed' && 'Call Failed'}
        </p>
      </div>
    </div>
   
    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-300">
        {connectionState === 'connecting' && 'Connecting...'}
        {connectionState === 'connected' && 'Connected'}
        {connectionState === 'disconnected' && 'Reconnecting...'}
        {connectionState === 'failed' && 'Connection Failed'}
      </span>
      <button
        onClick={onToggleMinimize}
        className="p-1 text-gray-300 hover:text-white"
      >
        {isCallMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
      </button>
    </div>
  </div>
);

const VideoCallDisplay = ({ localVideoRef, remoteVideoRef, isVideoMuted }: any) => (
  <div className="relative h-48 bg-black">
    <video
      ref={remoteVideoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
   
    <div className="absolute top-4 right-4 w-24 h-18 bg-gray-800 rounded-lg overflow-hidden">
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      {isVideoMuted && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <VideoOff size={16} className="text-gray-400" />
        </div>
      )}
    </div>
  </div>
);

const AudioCallDisplay = ({ currentChat, callState, callDuration, formatDuration }: any) => {
  if (callState !== 'connected') return null;
  
  return (
    <div className="flex items-center justify-center h-16 bg-gray-800">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {currentChat.name?.charAt(0) || 'U'}
          </span>
        </div>
        <div>
          <h4 className="font-medium">{currentChat.name}</h4>
          <p className="text-sm text-gray-300">Voice call - {formatDuration(callDuration)}</p>
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
  onEndCall
} : any) => (
  <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800">
    <button
      onClick={onToggleAudioMute}
      className={`p-3 rounded-full transition-colors ${
        isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
      }`}
      title={isAudioMuted ? 'Unmute' : 'Mute'}
    >
      {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
    </button>

    {isVideoCall && (
      <button
        onClick={onToggleVideoMute}
        className={`p-3 rounded-full transition-colors ${
          isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
        }`}
        title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
      >
        {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
      </button>
    )}

    <button
      onClick={onToggleRemoteAudio}
      className={`p-3 rounded-full transition-colors ${
        isRemoteAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
      }`}
      title={isRemoteAudioMuted ? 'Unmute remote' : 'Mute remote'}
    >
      {isRemoteAudioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>

    {callState === 'connected' && (
      <button
        onClick={onSwitchCallType}
        className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
        title={isVideoCall ? 'Switch to voice' : 'Switch to video'}
      >
        {isVideoCall ? <Phone size={20} /> : <Video size={20} />}
      </button>
    )}

    <button
      onClick={onEndCall}
      className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
      title="End call"
    >
      <PhoneOff size={20} />
    </button>
  </div>
);