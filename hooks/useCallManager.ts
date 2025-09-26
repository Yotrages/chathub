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
  const [incomingCall, setIncomingCall] = useState<{from: string, isVideo: boolean} | null>(null);
  const [callTimeout, setCallTimeout] = useState<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [maxReconnectAttempts] = useState(5);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { socket } = useSocket();
  const { user } = useSelector((state: RootState) => state.auth);

  const otherUserId = currentChat?.type === 'group' 
    ? null 
    : currentChat?.participants?.find((p: any) => p._id !== user?._id)?._id;

  // WebRTC Configuration with more STUN/TURN servers
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
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);
  }, []);

  const cleanup = useCallback(() => {
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

    if (callTimeout) {
      clearTimeout(callTimeout);
      setCallTimeout(null);
    }

    stopCallTimer();

    setCallState('idle');
    setConnectionState('new');
    setCallError(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsRemoteAudioMuted(false);
    setIsCallMinimized(false);
    setIncomingCall(null);
    setReconnectAttempts(0);
  }, [localStream, remoteStream, callTimeout, stopCallTimer]);

  const attemptReconnection = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setCallError('Maximum reconnection attempts reached. Call ended.');
      endCall();
      return;
    }

    setReconnectAttempts(prev => prev + 1);
    setCallError(`Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (peerConnectionRef.current?.connectionState === 'failed' || 
          peerConnectionRef.current?.connectionState === 'disconnected') {
        peerConnectionRef.current?.restartIce();
      }
    }, 2000);
  }, [reconnectAttempts, maxReconnectAttempts]);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
   
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socket && currentChat && otherUserId) {
        console.log('Sending ICE candidate to:', otherUserId);
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: otherUserId,
          callId: `${user?._id}-${otherUserId}-${Date.now()}`
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current?.connectionState;
      console.log('Connection state changed to:', state);
      setConnectionState(state as ConnectionState);
    
      if (state === 'connected') {
        setCallState('connected');
        setCallError(null);
        setReconnectAttempts(0); 
        if (callStartTimeRef.current === null) {
          startCallTimer();
        }
        toast.success('Call connected successfully');
      } else if (state === 'disconnected') {
        setCallError('Connection lost. Trying to reconnect...');
        attemptReconnection();
      } else if (state === 'failed') {
        if (reconnectAttempts < maxReconnectAttempts) {
          attemptReconnection();
        } else {
          setCallError('Connection failed permanently');
          endCall();
          socket?.emit('call_failed', { to: otherUserId, callId: `${user?._id}-${otherUserId}-${Date.now()}` });
          toast.error('Call connection failed');
        }
      }
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      const iceState = peerConnectionRef.current?.iceConnectionState;
      console.log('ICE Connection State:', iceState);
    
      if (iceState === 'failed') {
        setCallError('Network connection failed. Attempting to reconnect...');
        if (reconnectAttempts < maxReconnectAttempts) {
          attemptReconnection();
        }
      } else if (iceState === 'disconnected') {
        setCallError('Connection interrupted. Attempting to reconnect...');
        if (callState === 'connected') {
          attemptReconnection();
        }
      } else if (iceState === 'connected' || iceState === 'completed') {
        setCallError(null);
        setReconnectAttempts(0);
      }
    };

    return peerConnectionRef.current;
  }, [socket, currentChat, user?._id, otherUserId, startCallTimer, attemptReconnection, reconnectAttempts, maxReconnectAttempts, callState]);

  const startCall = useCallback(async (isVideo: boolean = false) => {
    if (!currentChat || !socket || !otherUserId) {
      toast.error('Cannot start call - connection or peer unavailable');
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
     
      console.log('Sending offer to:', otherUserId);
      socket.emit('offer', { sdp: offer, to: otherUserId, isVideo });
      socket.emit('call_request', { to: otherUserId, isVideo });

      const timeout = setTimeout(() => {
        if (callState === 'calling') {
          setCallError('Call not answered - you can still wait or end the call');
          socket.emit('call_timeout', { to: otherUserId, callId: `${user?._id}-${otherUserId}-${Date.now()}` });
          toast.error('Call not answered');
        }
      }, 30000);
      setCallTimeout(timeout);

    } catch (error: any) {
      console.error('Error starting call:', error);
      let message = 'Failed to start call';
    
      if (error.name === 'NotAllowedError') {
        message = 'Camera/microphone permission denied. Please allow access and try again.';
      } else if (error.name === 'NotFoundError') {
        message = 'No camera or microphone found.';
      } else if (error.name === 'NotSupportedError') {
        message = 'Browser does not support this feature.';
      }
    
      setCallError(message);
      setCallState('failed');
      socket?.emit('call_failed', { to: otherUserId, callId: `${user?._id}-${otherUserId}-${Date.now()}` });
      toast.error(message);
      
      setTimeout(() => {
        cleanup();
      }, 3000);
    }
  }, [currentChat, socket, otherUserId, initializePeerConnection, callState, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket || !otherUserId || callState !== 'ringing') {
      console.log('Cannot accept call - invalid state');
      return;
    }

    try {
      console.log('Accepting call from:', incomingCall.from);
      
      const pc = initializePeerConnection();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.isVideo,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      socket.emit('call_accept', { to: incomingCall.from });
      
      setIncomingCall(null);
      setCallState('connecting');
      setIsVideoCall(incomingCall.isVideo);
      
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
      
    } catch (error) {
      console.error('Error accepting call:', error);
      setCallError('Failed to accept call');
      socket?.emit('call_failed', { to: otherUserId, callId: `${user?._id}-${otherUserId}-${Date.now()}` });
      toast.error('Failed to accept call');
    }
  }, [incomingCall, socket, callTimeout, otherUserId, callState, initializePeerConnection]);

  const declineCall = useCallback(() => {
    if (incomingCall && socket && otherUserId) {
      console.log('Declining call from:', incomingCall.from);
      socket.emit('call_decline', { to: incomingCall.from });
      setIncomingCall(null);
      setCallState('idle');
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
    }
  }, [incomingCall, socket, callTimeout, otherUserId]);

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

  // Switch call type (voice to video or vice versa)
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

  const endCall = useCallback(() => {
    console.log('Ending call...');
    
    if (currentChat && socket && otherUserId && callState !== 'idle') {
      socket.emit('call_end', { to: otherUserId });
    }

    cleanup();
    
    toast.success('Call ended');
  }, [currentChat, socket, callState, otherUserId, cleanup]);

  useEffect(() => {
    if (!socket || !currentChat || !otherUserId) return;

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit; from: string; isVideo: boolean }) => {
      console.log('Received offer from:', data.from);
      if (data.from === otherUserId && peerConnectionRef.current && callState === 'ringing') {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          
          setIsVideoCall(data.isVideo);
        } catch (err) {
          console.error('Failed to set remote description from offer:', err);
          setCallError('Failed to process incoming call');
        }
      }
    };

    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit; from: string }) => {
      console.log('Received answer from:', data.from);
      if (data.from === otherUserId && peerConnectionRef.current && callState === 'calling') {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          setCallState('connected');
        } catch (err) {
          console.error('Failed to set remote description from answer:', err);
          setCallError('Failed to establish connection');
        }
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log('Received ICE candidate from:', data.from);
      if (data.from === otherUserId && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('ICE candidate error:', err);
        }
      }
    };

    const handleCallRequest = (data: { from: string; isVideo: boolean; timestamp: string }) => {
      console.log('Received call_request from:', data.from);
      if (currentChat.type === 'group') {
        console.log('Group calls not supported');
        return;
      }
      if (data.from === otherUserId && callState === 'idle') {
        setIncomingCall({ from: data.from, isVideo: data.isVideo });
        setCallState('ringing');
        setIsVideoCall(data.isVideo);
        
        initializePeerConnection();
        
        const timeout = setTimeout(() => {
          console.log('Auto-declining call due to timeout');
          declineCall();
          toast.error('Incoming call timeout');
        }, 30000);
        setCallTimeout(timeout);
      }
    };

    const handleCallAccept = async (data: { from: string; timestamp: string }) => {
      console.log('Received call_accept from:', data.from);
      if (data.from === otherUserId && callState === 'calling' && peerConnectionRef.current) {
        try {
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          socket.emit('answer', { sdp: answer, to: data.from });
          
          setCallState('connecting');
          
          if (callTimeout) {
            clearTimeout(callTimeout);
            setCallTimeout(null);
          }
        } catch (error) {
          console.error('Error creating answer after call accept:', error);
          setCallError('Failed to establish connection');
        }
      }
    };

    const handleCallEnd = (data: { from: string; timestamp: string }) => {
      console.log('Received call_end from:', data.from);
      if (data.from === otherUserId) {
        cleanup();
        toast.custom('Call ended by other user');
      }
    };

    const handleCallDecline = (data: { from: string; timestamp: string }) => {
      console.log('Received call_decline from:', data.from);
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
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call_request', handleCallRequest);
      socket.off('call_accept', handleCallAccept);
      socket.off('call_end', handleCallEnd);
      socket.off('call_decline', handleCallDecline);
    };
  }, [socket, currentChat, otherUserId, callState, callTimeout, declineCall, cleanup, initializePeerConnection]);

  useEffect(() => {
    if (!socket || !currentChat || !otherUserId) return;
   
    return () => {
      cleanup();
    };
  }, [socket, currentChat, otherUserId, cleanup]);

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