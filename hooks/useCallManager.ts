import { useState, useRef, useCallback } from 'react';
import { useSocket } from '@/context/socketContext';
import toast from 'react-hot-toast';

type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';
type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export const useCallManager = (currentChat: any, user: any, userStatuses: Map<string, any>) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [connectionState, setConnectionState] = useState<ConnectionState>('new');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{from: string, isVideo: boolean} | null>(null);
  const [callTimeout, setCallTimeout] = useState<NodeJS.Timeout | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { socket } = useSocket();

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:jb-turn1.xirsys.com' },
      {
        urls: [
          'turn:jb-turn1.xirsys.com:80?transport=udp',
          'turn:jb-turn1.xirsys.com:3478?transport=udp',
          'turn:jb-turn1.xirsys.com:80?transport=tcp',
          'turn:jb-turn1.xirsys.com:3478?transport=tcp',
          'turns:jb-turn1.xirsys.com:443?transport=tcp',
          'turns:jb-turn1.xirsys.com:5349?transport=tcp',
        ],
        username: '-vkE_HbUPxWY81OqkAwG7uEpErSNCRqPTX7nP6JyC8jwqzmrmSjtljr7ugCfPoayAAAAAGiBFnxxYXl5dW0=',
        credential: '515cb5a6-67e7-11f0-b95a-0242ac120004',
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCallTimer = useCallback(() => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);
  }, []);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socket && currentChat) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: currentChat._id,
          callId: `${user?._id}-${currentChat._id}-${Date.now()}`
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current?.connectionState;
      setConnectionState(state as ConnectionState);

      if (state === 'connected') {
        setCallState('connected');
        setCallError(null);
        startCallTimer();
        toast.success('Call connected successfully');
      } else if (state === 'failed' || state === 'disconnected') {
        setCallError('Connection lost. Trying to reconnect...');
        setTimeout(() => {
          if (peerConnectionRef.current?.connectionState === 'failed') {
            endCall();
            toast.error('Call connection failed');
          }
        }, 5000);
      }
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      const iceState = peerConnectionRef.current?.iceConnectionState;
      
      if (iceState === 'failed') {
        setCallError('Network connection failed. Please check your internet connection.');
      } else if (iceState === 'disconnected') {
        setCallError('Connection interrupted. Attempting to reconnect...');
      } else if (iceState === 'connected' || iceState === 'completed') {
        setCallError(null);
      }
    };

    return peerConnectionRef.current;
  }, [socket, currentChat, user?._id, startCallTimer]);

  const startCall = useCallback(async (isVideo: boolean = false) => {
    if (!currentChat || !socket) {
      toast.error('Cannot start call - connection unavailable');
      return;
    }

    if (currentChat.type === 'group') {
      toast.error('Group calls are not supported yet');
      return;
    }

    const validPeer = currentChat.participants.find((p: any) => p._id !== user?._id);
    if (!validPeer) {
      toast.error('No valid peer to call');
      return;
    }

    if (!userStatuses.get(validPeer._id)?.isOnline) {
      toast.error('User is offline');
      return;
    }

    try {
      setCallError(null);
      setCallState('calling');
      setIsVideoCall(isVideo);

      const pc = initializePeerConnection();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });

      await pc.setLocalDescription(offer);

      socket.emit('offer', { sdp: offer, to: validPeer._id, isVideo });
      socket.emit('call_request', { to: validPeer._id, isVideo });

      const timeout = setTimeout(() => {
        if (callState === 'calling') {
          setCallError('Call not answered');
          endCall();
          toast.error('Call not answered');
        }
      }, 30000);
      setCallTimeout(timeout);

    } catch (error: any) {
      let message = 'Failed to start call';
      
      if (error.name === 'NotAllowedError') {
        message = 'Camera/microphone permission denied. Please allow access and try again.';
      } else if (error.name === 'NotFoundError') {
        message = 'No camera or microphone found.';
      }

      setCallError(message);
      setCallState('failed');
      toast.error(message);
    }
  }, [currentChat, socket, user?._id, userStatuses, callState, initializePeerConnection]);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setCallState('idle');
    setConnectionState('new');
    setCallError(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsRemoteAudioMuted(false);
    setIsCallMinimized(false);
    setIncomingCall(null);

    if (callTimeout) {
      clearTimeout(callTimeout);
      setCallTimeout(null);
    }

    stopCallTimer();

    if (currentChat && socket && callState !== 'idle') {
      socket.emit('call_end', { to: currentChat._id });
    }
  }, [localStream, remoteStream, callTimeout, stopCallTimer, currentChat, socket, callState]);

  const acceptCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit('call_accept', { to: incomingCall.from });
      setIncomingCall(null);
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
    }
  }, [incomingCall, socket, callTimeout]);

  const declineCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit('call_decline', { to: incomingCall.from });
      setIncomingCall(null);
      setCallState('idle');
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
    }
  }, [incomingCall, socket, callTimeout]);

  const toggleAudioMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideoMute = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleRemoteAudio = useCallback(() => {
    if (remoteStream) {
      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsRemoteAudioMuted(!audioTrack.enabled);
      }
    }
  }, [remoteStream]);

  return {
    callState,
    connectionState,
    isVideoCall,
    callError,
    callDuration,
    isAudioMuted,
    isVideoMuted,
    isRemoteAudioMuted,
    isCallMinimized,
    localStream,
    remoteStream,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    peerConnectionRef,
    formatDuration,
    startCall,
    endCall,
    acceptCall,
    declineCall,
    toggleAudioMute,
    toggleVideoMute,
    toggleRemoteAudio,
    setIsCallMinimized,
    setIncomingCall,
    setCallState,
    setCallTimeout,
    initializePeerConnection
  };
};
