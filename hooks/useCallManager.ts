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

    // FIXED: Better remote track handling
    pc.ontrack = (event) => {
      console.log('📥 Received remote track:', event.track.kind, 'streams:', event.streams.length);
      
      if (event.streams[0]) {
        const stream = event.streams[0];
        console.log('📥 Remote stream tracks:', stream.getTracks().map(t => t.kind));
        
        // Set remote stream immediately
        setRemoteStream(stream);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          console.log('✅ Remote video ref srcObject set');
          
          // Ensure video plays
          remoteVideoRef.current.play().catch(err => {
            console.error('Error playing remote video:', err);
          });
        }
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
    console.log('📞 Starting call...', { isVideo, otherUserId: otherUserId.current, hasSocket: !!socket, isConnected });
    
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

      const callId = `${user?._id}-${otherUserId.current}-${Date.now()}`;
      currentCallIdRef.current = callId;

      console.log('🎬 Getting user media...');
      
      const mediaPromise = navigator.mediaDevices.getUserMedia({
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

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Camera/microphone timeout')), 10000)
      );

      const stream = await Promise.race([mediaPromise, timeoutPromise]) as MediaStream;
   
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

      // FIXED: Send call_request FIRST before creating offer
      console.log('📤 Sending call_request to:', otherUserId.current);
      socket.emit('call_request', { 
        to: otherUserId.current, 
        isVideo,
        callId 
      });
      
      // FIXED: Wait a bit for backend to create call session
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
      } else if (error.name === 'AbortError' || error.message.includes('Timeout')) {
        message = 'Camera/microphone timeout - check if another app is using it';
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

      // FIXED: Don't reinitialize peer connection, it already has the offer
      let pc = peerConnectionRef.current;
      
      // Only initialize if we don't have one yet
      if (!pc) {
        console.log('⚠️ No peer connection found, initializing...');
        pc = initializePeerConnection();
      } else {
        console.log('✅ Using existing peer connection with offer');
      }
      
      stream.getTracks().forEach((track) => {
        console.log('➕ Adding track to peer connection:', track.kind);
        pc.addTrack(track, stream);
      });

      // FIXED: Check if we have remote description (the offer)
      if (!pc.remoteDescription) {
        console.error('❌ No remote description set! Waiting for offer...');
        // Store acceptance state and wait for offer
        setCallState('connecting');
        setIncomingCall(null);
        setIsVideoCall(incomingCall.isVideo);
        
        socket.emit('call_accept', { 
          to: incomingCall.from,
          callId: incomingCall.callId 
        });
        
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        return;
      }

      console.log('📝 Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('✅ Local description (answer) set');

      // FIXED: Send answer immediately after creating it
      socket.emit('answer', { 
        sdp: answer, 
        to: incomingCall.from,
        callId: incomingCall.callId 
      });
      
      socket.emit('call_accept', { 
        to: incomingCall.from,
        callId: incomingCall.callId 
      });
      
      setIncomingCall(null);
      setCallState('connecting');
      setIsVideoCall(incomingCall.isVideo);
      
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
      console.log('📥 Received offer from:', data.from, 'Current other user:', otherUserId.current);
      
      // FIXED: Ensure peer connection exists before setting remote description
      let pc = peerConnectionRef.current;
      
      if (!pc) {
        console.log('⚠️ No peer connection, creating one for offer...');
        pc = initializePeerConnection();
      }
      
      if (pc) {
        try {
          console.log('📝 Setting remote description (offer)...');
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          currentCallIdRef.current = data.callId;
          setIsVideoCall(data.isVideo);
          console.log('✅ Set remote description for offer');
          
          // FIXED: If we're the callee and already accepted, create answer now
          if (callStateRef.current === 'connecting' || callStateRef.current === 'ringing') {
            console.log('📝 Auto-creating answer after receiving offer...');
            
            // Make sure we have local stream
            if (localStream) {
              localStream.getTracks().forEach((track) => {
                if (!pc.getSenders().find(s => s.track === track)) {
                  console.log('➕ Adding track:', track.kind);
                  pc.addTrack(track, localStream);
                }
              });
            }
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('✅ Created and set answer');
            
            socket.emit('answer', { 
              sdp: answer, 
              to: data.from,
              callId: data.callId 
            });
            console.log('📤 Sent answer to:', data.from);
          }
        } catch (err) {
          console.error('❌ Failed to set remote description:', err);
        }
      } else {
        console.warn('⚠️ No peer connection when offer received');
      }
    };

    // FIXED: Handle answer to transition User A to connected
    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit; from: string }) => {
      console.log('📥 Received answer from:', data.from);
      
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          setCallState('connecting');
          console.log('✅ Set remote description for answer, state: connecting');
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

    const handleCallRequest = (data: { from: string; isVideo: boolean; callId: string }) => {
      console.log('📞 Received call_request from:', data.from, 'Current state:', callStateRef.current);
      
      if (callStateRef.current !== 'idle') {
        console.log('⚠️ Already in a call, ignoring request');
        return;
      }

      otherUserId.current = data.from;
      console.log('📝 Updated otherUserId to caller:', data.from);
      
      setIncomingCall({ from: data.from, isVideo: data.isVideo, callId: data.callId });
      setCallState('ringing');
      setIsVideoCall(data.isVideo);
      currentCallIdRef.current = data.callId;
      
      // FIXED: Initialize peer connection immediately when call request comes in
      console.log('🔌 Initializing peer connection for incoming call...');
      initializePeerConnection();
      
      callTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-declining call due to timeout');
        declineCall();
        toast.error('Missed call');
      }, 45000);
    };

    // FIXED: Simplified - just handle state transition for User A (caller)
    const handleCallAccept = async (data: { from: string; callId: string }) => {
      console.log('✅ Received call_accept from:', data.from);
      
      // Clear the timeout when call is accepted
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      
      // FIXED: User A (caller) just transitions to connecting
      // Answer will come separately from User B
      setCallState('connecting');
      console.log('✅ User A transitioned to connecting state, waiting for answer...');
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