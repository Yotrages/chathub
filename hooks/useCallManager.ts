import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { useSocket } from '@/context/socketContext';
import toast from 'react-hot-toast';

type CallState = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed';
type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export const useCallManagement = (currentChat: any) => {
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
  const [incomingCall, setIncomingCall] = useState<{from: string, isVideo: boolean, callId: string} | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const callStateRef = useRef<CallState>('idle');

  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state: RootState) => state.auth);

  const otherUserId = useRef<string | null>(null);
  
  useEffect(() => {
    if (currentChat?.type !== 'group') {
      const other = currentChat?.participants?.find((p: any) => p._id !== user?._id)?._id;
      otherUserId.current = other || null;
      console.log('📝 Updated otherUserId:', otherUserId.current);
    } else {
      otherUserId.current = null;
    }
  }, [currentChat, user?._id]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
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
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
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
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);
  }, []);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up call resources...');
    
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped local track:', track.kind);
      });
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

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    stopCallTimer();
    currentCallIdRef.current = null;
    reconnectAttemptsRef.current = 0;

    setCallState('idle');
    setConnectionState('new');
    setCallError(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsRemoteAudioMuted(false);
    setIsCallMinimized(false);
    setIncomingCall(null);
  }, [localStream, remoteStream, stopCallTimer]);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
   
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && otherUserId.current && currentCallIdRef.current) {
        console.log('📤 Sending ICE candidate');
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: otherUserId.current,
          callId: currentCallIdRef.current
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📥 Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('🔗 Connection state:', state);
      setConnectionState(state as ConnectionState);
    
      if (state === 'connected') {
        setCallState('connected');
        setCallError(null);
        reconnectAttemptsRef.current = 0;
        if (callStartTimeRef.current === null) {
          startCallTimer();
        }
        toast.success('Call connected');
      } else if (state === 'disconnected') {
        setCallError('Connection interrupted. Reconnecting...');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            pc.restartIce();
          }, 2000);
        }
      } else if (state === 'failed') {
        setCallError('Connection failed');
        endCall();
      }
    };

    return pc;
  }, [socket, startCallTimer]);

const startCall = useCallback(async (isVideo: boolean = false) => {
  console.log('📞 Starting call...', { isVideo, otherUserId: otherUserId.current });
  
  if (!currentChat || !socket || !otherUserId.current || !isConnected) {
    toast.error('Cannot start call - connection unavailable');
    return;
  }
  
  if (currentChat.type === 'group') {
    toast.error('Group calls are not supported yet');
    return;
  }

  try {
    setCallError(null);
    setCallState('calling');
    setIsVideoCall(isVideo);

    const callId = `${user?._id}-${otherUserId.current}-${Date.now()}`;
    currentCallIdRef.current = callId;

    console.log('🎬 Getting user media...');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: isVideo ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } : false,
    });
 
    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    console.log('🔌 Initializing peer connection...');
    const pc = initializePeerConnection();
 
    stream.getTracks().forEach((track) => {
      console.log('➕ Adding track to peer connection:', track.kind);
      pc.addTrack(track, stream);
    });

    // CRITICAL FIX 1: Send call_request FIRST and wait for session creation
    console.log('📤 Sending call_request to:', otherUserId.current);
    socket.emit('call_request', { 
      to: otherUserId.current, 
      isVideo,
      callId 
    });
    
    // CRITICAL FIX 2: Wait for backend to create session before sending offer
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('📝 Creating offer...');
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: isVideo,
    });

    await pc.setLocalDescription(offer);
    console.log('✅ Local description set');
 
    console.log('📤 Sending offer to:', otherUserId.current);
    socket.emit('offer', { 
      sdp: offer, 
      to: otherUserId.current, 
      isVideo,
      callId 
    });

    callTimeoutRef.current = setTimeout(() => {
      const currentState = callStateRef.current;
      console.log('⏰ Call timeout check - Current state:', currentState);
      
      if (currentState === 'calling' || currentState === 'ringing') {
        console.log('⏰ Call timeout - ending call');
        setCallError('No answer');
        toast.error('No answer');
        
        socket.emit('call_timeout', { 
          to: otherUserId.current, 
          callId 
        });
        
        setTimeout(() => {
          cleanup();
        }, 2000);
      }
    }, 45000);

  } catch (error: any) {
    console.error('❌ Error starting call:', error);
    let message = 'Failed to start call';

    if (error.name === 'NotAllowedError') {
      message = 'Camera/microphone permission denied';
    } else if (error.name === 'NotFoundError') {
      message = 'No camera or microphone found';
    } else if (error.name === 'NotReadableError') {
      message = 'Camera/microphone is already in use';
    }

    setCallError(message);
    setCallState('failed');
    toast.error(message);
    
    setTimeout(() => cleanup(), 2000);
  }
}, [currentChat, socket, isConnected, initializePeerConnection, cleanup, user?._id]);

const acceptCall = useCallback(async () => {
  console.log('✅ Accepting call...');
  
  if (!incomingCall || !socket) {
    console.error('Cannot accept call - invalid state');
    return;
  }

  try {
    setCallState('connecting'); // CRITICAL FIX 3: Update state immediately
    setIsVideoCall(incomingCall.isVideo);
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: incomingCall.isVideo ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } : false,
    });
    
    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const pc = initializePeerConnection();
    
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // CRITICAL FIX 4: Emit call_accept FIRST
    console.log('📤 Emitting call_accept');
    socket.emit('call_accept', { 
      to: incomingCall.from,
      callId: incomingCall.callId 
    });
    
    setIncomingCall(null);
    
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    
  } catch (error) {
    console.error('❌ Error accepting call:', error);
    setCallError('Failed to accept call');
    toast.error('Failed to accept call');
    cleanup();
  }
}, [incomingCall, socket, initializePeerConnection, cleanup]);


  const declineCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit('call_decline', { 
        to: incomingCall.from,
        callId: incomingCall.callId 
      });
      setIncomingCall(null);
      setCallState('idle');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    }
  }, [incomingCall, socket]);

  const endCall = useCallback(() => {
    console.log('🔚 Ending call...');
    
    if (socket && otherUserId.current && callStateRef.current !== 'idle' && currentCallIdRef.current) {
      socket.emit('call_end', { 
        to: otherUserId.current,
        callId: currentCallIdRef.current 
      });
    }

    cleanup();
    toast.success('Call ended');
  }, [socket, cleanup]);

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

  const switchCallType = useCallback(async () => {
    if (!peerConnectionRef.current || callState !== 'connected') return;
  
    try {
      const newIsVideo = !isVideoCall;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: newIsVideo,
        audio: true
      });
    
      const sender = peerConnectionRef.current.getSenders().find(s =>
        s.track && s.track.kind === 'video'
      );
    
      if (newIsVideo && !sender) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          peerConnectionRef.current.addTrack(videoTrack, stream);
        }
      } else if (!newIsVideo && sender) {
        peerConnectionRef.current.removeTrack(sender);
      } else if (newIsVideo && sender) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }
    
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsVideoCall(newIsVideo);
    
    } catch (error) {
      console.error('Failed to switch call type:', error);
      setCallError('Failed to switch call type');
    }
  }, [callState, isVideoCall]);

  // FIXED: Socket event handlers with proper dependency handling
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Setting up socket event handlers...');

    const handleCallError = (data: { error: string; reason?: string }) => {
      console.log('❌ Received call_error:', data);
      setCallError(data.error);
      toast.error(data.error);
    };

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit; from: string; isVideo: boolean; callId: string }) => {
      console.log('📥 Received offer from:', data.from, 'Current other user:', otherUserId.current);
      
      // FIXED: Accept offer from anyone, not just current chat
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          currentCallIdRef.current = data.callId;
          setIsVideoCall(data.isVideo);
          console.log('✅ Set remote description for offer');
        } catch (err) {
          console.error('❌ Failed to set remote description:', err);
        }
      } else {
        console.warn('⚠️ No peer connection when offer received');
      }
    };

    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit; from: string }) => {
      console.log('📥 Received answer from:', data.from);
      
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          setCallState('connecting');
          console.log('✅ Set remote description for answer');
        } catch (err) {
          console.error('❌ Failed to set remote description:', err);
        }
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log('📥 Received ICE candidate from:', data.from);
      
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('✅ Added ICE candidate');
        } catch (err) {
          console.error('❌ ICE candidate error:', err);
        }
      }
    };

    // FIXED: Accept calls from anyone, update otherUserId dynamically
    const handleCallRequest = (data: { from: string; isVideo: boolean; callId: string }) => {
      console.log('📞 Received call_request from:', data.from, 'Current state:', callStateRef.current);
      
      if (callStateRef.current !== 'idle') {
        console.log('⚠️ Already in a call, ignoring request');
        return;
      }

      // FIXED: Update otherUserId to the caller
      otherUserId.current = data.from;
      console.log('📝 Updated otherUserId to caller:', data.from);
      
      setIncomingCall({ from: data.from, isVideo: data.isVideo, callId: data.callId });
      setCallState('ringing');
      setIsVideoCall(data.isVideo);
      currentCallIdRef.current = data.callId;
      
      initializePeerConnection();
      
      callTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-declining call due to timeout');
        declineCall();
        toast.error('Missed call');
      }, 45000);
    };

const handleCallAccept = async (data: { from: string; callId: string }) => {
  console.log('✅ Received call_accept from:', data.from);
  
  if (peerConnectionRef.current) {
    try {
      // CRITICAL: Update state to show connection is being established
      setCallState('connecting');
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      socket.emit('answer', { 
        sdp: answer, 
        to: data.from,
        callId: data.callId 
      });
      
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('❌ Error creating answer:', error);
    }
  }
};


    const handleCallEnd = (data: { from: string }) => {
      console.log('🔚 Received call_end from:', data.from);
      cleanup();
      toast.custom('Call ended');
    };

    const handleCallDecline = (data: { from: string }) => {
      console.log('❌ Received call_decline from:', data.from);
      cleanup();
      toast.error('Call declined');
    };

    const handleCallTimeout = (data: { callId: string }) => {
      console.log('⏰ Received call_timeout');
      setCallError('No answer');
      toast.error('Call timeout - no answer');
      
      setTimeout(() => cleanup(), 2000);
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call_request', handleCallRequest);
    socket.on('call_accept', handleCallAccept);
    socket.on('call_end', handleCallEnd);
    socket.on('call_decline', handleCallDecline);
    socket.on('call_error', handleCallError);
    socket.on('call_timeout', handleCallTimeout);

    return () => {
      console.log('🧹 Cleaning up socket event handlers');
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call_request', handleCallRequest);
      socket.off('call_accept', handleCallAccept);
      socket.off('call_end', handleCallEnd);
      socket.off('call_decline', handleCallDecline);
      socket.off('call_error', handleCallError);
      socket.off('call_timeout', handleCallTimeout);
    };
  }, [socket, isConnected, initializePeerConnection, declineCall, cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

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
    localVideoRef,
    remoteVideoRef,
    incomingCall,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudioMute,
    toggleVideoMute,
    toggleRemoteAudio,
    switchCallType,
    setIsCallMinimized,
    formatDuration
  };
};