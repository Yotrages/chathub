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
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const isCallerRef = useRef(false);

  const { socket, isConnected } = useSocket();
  const { user } = useSelector((state: RootState) => state.auth);

  const otherUserId = useRef<string | null>(null);
  
  useEffect(() => {
    if (currentChat?.type !== 'group') {
      const other = currentChat?.participants?.find((p: any) => p._id !== user?._id)?._id;
      otherUserId.current = other || null;
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
    iceCandidateQueue.current = [];
    isCallerRef.current = false;

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
      console.log('🔌 Closing existing peer connection');
      peerConnectionRef.current.close();
    }
   
    console.log('🔌 Creating new peer connection');
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && otherUserId.current && currentCallIdRef.current) {
        console.log('📤 Sending ICE candidate:', event.candidate.candidate);
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: otherUserId.current,
          callId: currentCallIdRef.current
        });
      } else if (!event.candidate) {
        console.log('✅ ICE gathering complete');
      }
    };

    pc.ontrack = (event) => {
      console.log('📥 ontrack fired:', {
        kind: event.track.kind,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState,
        streams: event.streams.length
      });
      
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log('📥 Setting remote stream with tracks:', 
          stream.getTracks().map(t => `${t.kind}:${t.readyState}`)
        );
        
        setRemoteStream(stream);
        
        // CRITICAL: Set srcObject and play immediately
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          console.log('✅ Remote video srcObject set');
          
          // Force play for mobile
          setTimeout(() => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.play()
                .then(() => console.log('✅ Remote video playing'))
                .catch(err => {
                  console.error('❌ Remote video play error:', err);
                  // Retry on mobile after touch
                  const playOnTouch = () => {
                    remoteVideoRef.current?.play();
                    document.removeEventListener('touchstart', playOnTouch);
                    document.removeEventListener('click', playOnTouch);
                  };
                  document.addEventListener('touchstart', playOnTouch);
                  document.addEventListener('click', playOnTouch);
                });
            }
          }, 100);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log('📡 Signaling state:', pc.signalingState);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('🔗 Connection state:', state);
      setConnectionState(state as ConnectionState);
    
      if (state === 'connected') {
        console.log('✅ Peer connection established');
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
            if (pc.connectionState === 'disconnected') {
              console.log('🔄 Attempting ICE restart...');
              pc.restartIce();
            }
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
    
    if (!currentChat || !socket || !otherUserId.current) {
      toast.error('Cannot start call - connection unavailable');
      return;
    }
    
    if (!isConnected) {
      toast.error('Not connected to server. Please wait...');
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
      isCallerRef.current = true;

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

      console.log('✅ Got local stream:', stream.getTracks().map(t => `${t.kind}:${t.readyState}`));
   
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }

      console.log('🔌 Initializing peer connection...');
      const pc = initializePeerConnection();
   
      // Add tracks with transceivers for better control
      stream.getTracks().forEach((track) => {
        console.log('➕ Adding track:', track.kind);
        pc.addTrack(track, stream);
      });

      // Send call_request FIRST
      console.log('📤 Sending call_request');
      socket.emit('call_request', { 
        to: otherUserId.current, 
        isVideo,
        callId 
      });
      
      // Wait for session creation
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('📝 Creating offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });
  
      console.log('📝 Setting local description...');
      await pc.setLocalDescription(offer);
      console.log('✅ Local description set:', pc.localDescription?.type);
   
      console.log('📤 Sending offer');
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
          
          setTimeout(() => cleanup(), 2000);
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
      setCallState('connecting');
      const callData = { ...incomingCall };
      setIncomingCall(null);
      setIsVideoCall(callData.isVideo);
      isCallerRef.current = false;
      
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      console.log('🎬 Getting user media for answer...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callData.isVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
      });

      console.log('✅ Got local stream:', stream.getTracks().map(t => `${t.kind}:${t.readyState}`));
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }

      // Use existing peer connection or create new one
      let pc = peerConnectionRef.current;
      if (!pc) {
        console.log('⚠️ No peer connection, creating new one');
        pc = initializePeerConnection();
      }
      
      // Add tracks
      stream.getTracks().forEach((track) => {
        console.log('➕ Adding track:', track.kind);
        pc.addTrack(track, stream);
      });

      // Wait a bit for offer to arrive if not already set
      if (!pc.remoteDescription) {
        console.log('⏳ Waiting for offer to arrive...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check again
      if (!pc.remoteDescription) {
        console.error('❌ Still no remote description after waiting!');
        // Send accept anyway, answer will be created when offer arrives
        socket.emit('call_accept', { 
          to: callData.from,
          callId: callData.callId 
        });
        return;
      }

      console.log('📝 Creating answer...');
      const answer = await pc.createAnswer();
      
      console.log('📝 Setting local description...');
      await pc.setLocalDescription(answer);
      console.log('✅ Local description set:', pc.localDescription?.type);

      // Process queued ICE candidates
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        if (candidate) {
          console.log('🧊 Adding queued ICE candidate');
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      // Send answer
      console.log('📤 Sending answer');
      socket.emit('answer', { 
        sdp: answer, 
        to: callData.from,
        callId: callData.callId 
      });
      
      console.log('📤 Sending call_accept');
      socket.emit('call_accept', { 
        to: callData.from,
        callId: callData.callId 
      });
      
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
        console.log('🎤 Audio', audioTrack.enabled ? 'unmuted' : 'muted');
      }
    }
  }, [localStream]);

  const toggleVideoMute = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
        console.log('📹 Video', videoTrack.enabled ? 'unmuted' : 'muted');
      }
    }
  }, [localStream]);

  const toggleRemoteAudio = useCallback(() => {
    if (remoteStream) {
      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsRemoteAudioMuted(!audioTrack.enabled);
        console.log('🔊 Remote audio', audioTrack.enabled ? 'unmuted' : 'muted');
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

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Setting up socket event handlers...');

    const handleCallError = (data: { error: string; reason?: string }) => {
      console.log('❌ Received call_error:', data);
      setCallError(data.error);
      toast.error(data.error);
    };

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit; from: string; isVideo: boolean; callId: string }) => {
      console.log('📥 Received offer from:', data.from);
      
      let pc = peerConnectionRef.current;
      if (!pc) {
        console.log('⚠️ No peer connection, creating one');
        pc = initializePeerConnection();
      }
      
      try {
        console.log('📝 Setting remote description (offer)...');
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        console.log('✅ Remote description set');
        
        // If we have local stream (already accepted), create answer immediately
        if (localStream && !isCallerRef.current) {
          console.log('📝 Creating answer immediately (already accepted)...');
          
          // Add tracks if not already added
          const senders = pc.getSenders();
          localStream.getTracks().forEach((track) => {
            if (!senders.find(s => s.track === track)) {
              console.log('➕ Adding track:', track.kind);
              pc.addTrack(track, localStream);
            }
          });
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('✅ Answer created and set');
          
          socket.emit('answer', { 
            sdp: answer, 
            to: data.from,
            callId: data.callId 
          });
          console.log('📤 Answer sent');
        }
      } catch (err) {
        console.error('❌ Error handling offer:', err);
      }
    };

    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit; from: string }) => {
      console.log('📥 Received answer from:', data.from);
      
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error('❌ No peer connection for answer');
        return;
      }
      
      try {
        console.log('📝 Setting remote description (answer)...');
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        console.log('✅ Remote description set');
        
        // Process queued ICE candidates
        while (iceCandidateQueue.current.length > 0) {
          const candidate = iceCandidateQueue.current.shift();
          if (candidate) {
            console.log('🧊 Adding queued ICE candidate');
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
        
        setCallState('connecting');
      } catch (err) {
        console.error('❌ Error setting answer:', err);
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log('📥 Received ICE candidate from:', data.from);
      
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.log('⚠️ No peer connection, queuing candidate');
        iceCandidateQueue.current.push(data.candidate);
        return;
      }
      
      if (!pc.remoteDescription) {
        console.log('⚠️ No remote description yet, queuing candidate');
        iceCandidateQueue.current.push(data.candidate);
        return;
      }
      
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('✅ ICE candidate added');
      } catch (err) {
        console.error('❌ Error adding ICE candidate:', err);
      }
    };

    const handleCallRequest = (data: { from: string; isVideo: boolean; callId: string }) => {
      console.log('📞 Received call_request from:', data.from);
      
      if (callStateRef.current !== 'idle') {
        console.log('⚠️ Already in a call, ignoring');
        return;
      }

      otherUserId.current = data.from;
      currentCallIdRef.current = data.callId;
      
      setIncomingCall({ from: data.from, isVideo: data.isVideo, callId: data.callId });
      setCallState('ringing');
      setIsVideoCall(data.isVideo);
      
      // Initialize peer connection
      initializePeerConnection();
      
      callTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-declining call');
        declineCall();
        toast.error('Missed call');
      }, 45000);
    };

    const handleCallAccept = (data: { from: string; callId: string }) => {
      console.log('✅ Received call_accept from:', data.from);
      
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      
      setCallState('connecting');
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
      toast.error('Call timeout');
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
  }, [socket, isConnected, initializePeerConnection, declineCall, cleanup, localStream]);

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
    localStream,
    remoteStream,
    peerConnectionRef,
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