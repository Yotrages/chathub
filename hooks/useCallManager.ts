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
  const [callTimeout, setCallTimeout] = useState<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(5);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'poor' | 'disconnected'>('good');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const iceGatheringCompleteRef = useRef(false);

  const { socket } = useSocket();
  const { user } = useSelector((state: RootState) => state.auth);

  const otherUserId = currentChat?.type === 'group' 
    ? null 
    : currentChat?.participants?.find((p: any) => p._id !== user?._id)?._id;

  // Enhanced WebRTC Configuration
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
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
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
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

    if (callTimeout) {
      clearTimeout(callTimeout);
      setCallTimeout(null);
    }

    stopCallTimer();
    currentCallIdRef.current = null;
    iceGatheringCompleteRef.current = false;

    setCallState('idle');
    setConnectionState('new');
    setCallError(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsRemoteAudioMuted(false);
    setIsCallMinimized(false);
    setIncomingCall(null);
    setReconnectAttempts(0);
    setNetworkQuality('good');
  }, [localStream, remoteStream, callTimeout, stopCallTimer]);

  const attemptReconnection = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setCallError('Connection lost. Call ended.');
      toast.error('Call ended due to connection issues');
      endCall();
      return;
    }

    setReconnectAttempts(prev => prev + 1);
    setCallError(`Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    setNetworkQuality('poor');
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (peerConnectionRef.current) {
        const state = peerConnectionRef.current.connectionState;
        if (state === 'failed' || state === 'disconnected') {
          console.log('Attempting ICE restart...');
          peerConnectionRef.current.restartIce();
        }
      }
    }, 2000);
  }, [reconnectAttempts, maxReconnectAttempts]);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
   
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;
    iceGatheringCompleteRef.current = false;

    // ICE Candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && otherUserId && currentCallIdRef.current) {
        console.log('📤 Sending ICE candidate to:', otherUserId);
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: otherUserId,
          callId: currentCallIdRef.current
        });
      }
    };

    // ICE gathering state monitoring
    pc.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', pc.iceGatheringState);
      if (pc.iceGatheringState === 'complete') {
        iceGatheringCompleteRef.current = true;
      }
    };

    // Remote track handling
    pc.ontrack = (event) => {
      console.log('📥 Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('🔗 Connection state:', state);
      setConnectionState(state as ConnectionState);
    
      if (state === 'connected') {
        setCallState('connected');
        setCallError(null);
        setReconnectAttempts(0);
        setNetworkQuality('good');
        if (callStartTimeRef.current === null) {
          startCallTimer();
        }
        toast.success('Call connected');
      } else if (state === 'disconnected') {
        setNetworkQuality('poor');
        setCallError('Connection interrupted. Reconnecting...');
        attemptReconnection();
      } else if (state === 'failed') {
        setNetworkQuality('disconnected');
        if (reconnectAttempts < maxReconnectAttempts) {
          attemptReconnection();
        } else {
          setCallError('Connection failed');
          endCall();
          toast.error('Call connection failed');
        }
      }
    };

    // ICE connection state monitoring
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      console.log('🧊 ICE state:', iceState);
    
      if (iceState === 'failed') {
        setNetworkQuality('disconnected');
        setCallError('Network connection failed. Reconnecting...');
        if (reconnectAttempts < maxReconnectAttempts) {
          attemptReconnection();
        }
      } else if (iceState === 'disconnected') {
        setNetworkQuality('poor');
        setCallError('Connection interrupted. Reconnecting...');
        if (callState === 'connected') {
          attemptReconnection();
        }
      } else if (iceState === 'connected' || iceState === 'completed') {
        setNetworkQuality('good');
        setCallError(null);
        setReconnectAttempts(0);
      }
    };

    return pc;
  }, [socket, otherUserId, user?._id, startCallTimer, attemptReconnection, reconnectAttempts, maxReconnectAttempts, callState]);

  const startCall = useCallback(async (isVideo: boolean = false) => {
    console.log('📞 Starting call...', { isVideo, otherUserId, hasSocket: !!socket });
    
    if (!currentChat || !socket || !otherUserId) {
      toast.error('Cannot start call - connection unavailable');
      return;
    }
    
    if (!socket.connected) {
      toast.error('Connection not established. Please wait and try again.');
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
      setReconnectAttempts(0);

      const callId = `${user?._id}-${otherUserId}-${Date.now()}`;
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

      console.log('📝 Creating offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });
  
      await pc.setLocalDescription(offer);
      console.log('✅ Local description set');
   
      // Send call request first
      console.log('📤 Sending call_request to:', otherUserId);
      socket.emit('call_request', { 
        to: otherUserId, 
        isVideo,
        callId 
      });
      
      // Wait briefly for ICE candidates to be gathered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then send offer
      console.log('📤 Sending offer to:', otherUserId);
      socket.emit('offer', { 
        sdp: offer, 
        to: otherUserId, 
        isVideo,
        callId 
      });

      // Set timeout for no answer
      const timeout = setTimeout(() => {
        if (callState === 'calling' || callState === 'ringing') {
          console.log('⏰ Call timeout - no answer');
          setCallError('No answer');
          socket.emit('call_timeout', { 
            to: otherUserId, 
            callId 
          });
          toast.error('No answer');
          setTimeout(() => cleanup(), 3000);
        }
      }, 45000); // 45 seconds
      setCallTimeout(timeout);

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
      
      setTimeout(() => cleanup(), 3000);
    }
  }, [currentChat, socket, otherUserId, initializePeerConnection, callState, cleanup, user?._id]);

  const acceptCall = useCallback(async () => {
    console.log('✅ Accepting call...');
    
    if (!incomingCall || !socket || !otherUserId) {
      console.error('Cannot accept call - invalid state');
      return;
    }

    try {
      console.log('🎬 Getting user media for answer...');
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

      console.log('🔌 Initializing peer connection for answer...');
      const pc = initializePeerConnection();
      
      stream.getTracks().forEach((track) => {
        console.log('➕ Adding track:', track.kind);
        pc.addTrack(track, stream);
      });

      // Send call accept BEFORE creating answer
      console.log('📤 Sending call_accept to:', incomingCall.from);
      socket.emit('call_accept', { 
        to: incomingCall.from,
        callId: incomingCall.callId 
      });
      
      setIncomingCall(null);
      setCallState('connecting');
      setIsVideoCall(incomingCall.isVideo);
      
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
      
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      setCallError('Failed to accept call');
      toast.error('Failed to accept call');
      cleanup();
    }
  }, [incomingCall, socket, callTimeout, otherUserId, initializePeerConnection, cleanup]);

  const declineCall = useCallback(() => {
    console.log('❌ Declining call...');
    
    if (incomingCall && socket && otherUserId) {
      socket.emit('call_decline', { 
        to: incomingCall.from,
        callId: incomingCall.callId 
      });
      setIncomingCall(null);
      setCallState('idle');
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
    }
  }, [incomingCall, socket, callTimeout, otherUserId]);

  const endCall = useCallback(() => {
    console.log('🔚 Ending call...');
    
    if (currentChat && socket && otherUserId && callState !== 'idle' && currentCallIdRef.current) {
      socket.emit('call_end', { 
        to: otherUserId,
        callId: currentCallIdRef.current 
      });
    }

    cleanup();
    toast.success('Call ended');
  }, [currentChat, socket, callState, otherUserId, cleanup]);

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
    if (!peerConnectionRef.current || callState !== 'connected' || !otherUserId) return;
  
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
  }, [callState, isVideoCall, otherUserId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !currentChat || !otherUserId) return;

    console.log('🔌 Setting up socket event handlers...');

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit; from: string; isVideo: boolean; callId: string }) => {
      console.log('📥 Received offer from:', data.from);
      
      if (data.from === otherUserId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          console.log('✅ Remote description set from offer');
          currentCallIdRef.current = data.callId;
          setIsVideoCall(data.isVideo);
        } catch (err) {
          console.error('❌ Failed to set remote description:', err);
          setCallError('Failed to process incoming call');
        }
      }
    };

    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit; from: string }) => {
      console.log('📥 Received answer from:', data.from);
      
      if (data.from === otherUserId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          console.log('✅ Remote description set from answer');
          setCallState('connecting');
        } catch (err) {
          console.error('❌ Failed to set remote description:', err);
          setCallError('Failed to establish connection');
        }
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log('📥 Received ICE candidate from:', data.from);
      
      if (data.from === otherUserId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('❌ ICE candidate error:', err);
        }
      }
    };

    const handleCallRequest = (data: { from: string; isVideo: boolean; callId: string }) => {
      console.log('📞 Received call_request from:', data.from);
      
      if (data.from === otherUserId && callState === 'idle') {
        setIncomingCall({ from: data.from, isVideo: data.isVideo, callId: data.callId });
        setCallState('ringing');
        setIsVideoCall(data.isVideo);
        currentCallIdRef.current = data.callId;
        
        initializePeerConnection();
        
        const timeout = setTimeout(() => {
          console.log('⏰ Auto-declining call due to timeout');
          declineCall();
          toast.error('Missed call');
        }, 45000);
        setCallTimeout(timeout);
      }
    };

    const handleCallAccept = async (data: { from: string; callId: string }) => {
      console.log('✅ Received call_accept from:', data.from);
      
      if (data.from === otherUserId && peerConnectionRef.current) {
        try {
          console.log('📝 Creating answer...');
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          // Wait briefly for ICE candidates
          await new Promise(resolve => setTimeout(resolve, 300));
          
          console.log('📤 Sending answer to:', data.from);
          socket.emit('answer', { 
            sdp: answer, 
            to: data.from,
            callId: data.callId 
          });
          
          setCallState('connecting');
          
          if (callTimeout) {
            clearTimeout(callTimeout);
            setCallTimeout(null);
          }
        } catch (error) {
          console.error('❌ Error creating answer:', error);
          setCallError('Failed to establish connection');
        }
      }
    };

    const handleCallEnd = (data: { from: string }) => {
      console.log('🔚 Received call_end from:', data.from);
      
      if (data.from === otherUserId) {
        cleanup();
        toast.custom('Call ended');
      }
    };

    const handleCallDecline = (data: { from: string }) => {
      console.log('❌ Received call_decline from:', data.from);
      
      if (data.from === otherUserId) {
        cleanup();
        toast.error('Call declined');
      }
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call_request', handleCallRequest);
    socket.on('call_accept', handleCallAccept);
    socket.on('call_end', handleCallEnd);
    socket.on('call_decline', handleCallDecline);

    return () => {
      console.log('Cleaning up socket event handlers');
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call_request', handleCallRequest);
      socket.off('call_accept', handleCallAccept);
      socket.off('call_end', handleCallEnd);
      socket.off('call_decline', handleCallDecline);
    };
  }, [socket, currentChat, otherUserId, callState, callTimeout, declineCall, cleanup, initializePeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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
    networkQuality,
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