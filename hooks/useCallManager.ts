import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { useSocket } from '@/context/socketContext';
import toast from 'react-hot-toast';

type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';
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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { socket } = useSocket();
  const { user } = useSelector((state: RootState) => state.auth);

  // Enhanced WebRTC Configuration
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

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start call timer
  const startCallTimer = useCallback(() => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  // Stop call timer
  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);
  }, []);

  // Initialize peer connection with enhanced error handling
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socket && currentChat) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: currentChat._id,
          callId: `${user?._id}-${currentChat._id}-${Date.now()}`
        });
      }
    };

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle connection state changes
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

    // Handle ICE connection state changes
    peerConnectionRef.current.oniceconnectionstatechange = () => {
      const iceState = peerConnectionRef.current?.iceConnectionState;
      console.log('ICE Connection State:', iceState);
     
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

  // Start a call with enhanced error handling
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
      toast.error(message);
    }
  }, [currentChat, socket, user?._id, initializePeerConnection, callState]);

  // Accept incoming call
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

  // Decline incoming call
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

  // Toggle audio mute
  const toggleAudioMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video mute
  const toggleVideoMute = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle remote audio
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

  // End call with cleanup
  const endCall = useCallback(() => {
    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
   
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset states
    setCallState('idle');
    setConnectionState('new');
    setCallError(null);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    setIsRemoteAudioMuted(false);
    setIsCallMinimized(false);
    setIncomingCall(null);
   
    // Clear timeouts
    if (callTimeout) {
      clearTimeout(callTimeout);
      setCallTimeout(null);
    }
   
    // Stop call timer
    stopCallTimer();

    // Notify other user
    if (currentChat && socket && callState !== 'idle') {
      socket.emit('call_end', { to: currentChat._id });
    }

    // Reinitialize peer connection for next call
    setTimeout(() => {
      if (socket && currentChat) {
        initializePeerConnection();
      }
    }, 1000);
  }, [localStream, remoteStream, callTimeout, stopCallTimer, currentChat, socket, callState, initializePeerConnection]);

  // Socket event listeners for call signaling
  useEffect(() => {
    if (!socket || !currentChat) return;

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit; from: string; isVideo: boolean }) => {
      if (data.from === currentChat._id && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
         
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: data.isVideo,
          });
         
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
         
          stream.getTracks().forEach((track) => {
            peerConnectionRef.current?.addTrack(track, stream);
          });

          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
         
          socket.emit('answer', { sdp: answer, to: data.from });
          setCallState('connected');
          setIsVideoCall(data.isVideo);
         
        } catch (err) {
          console.error('Answer creation failed:', err);
          setCallError('Failed to accept call');
          setCallState('failed');
        }
      }
    };

    const handleAnswer = async (data: { sdp: RTCSessionDescriptionInit; from: string }) => {
      if (data.from === currentChat._id && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          setCallState('connected');
        } catch (err) {
          console.error('Failed to set remote description:', err);
          setCallError('Failed to establish connection');
        }
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
      if (data.from === currentChat._id && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('ICE candidate error:', err);
        }
      }
    };

    const handleCallRequest = (data: { from: string; isVideo: boolean; timestamp: string }) => {
      if (data.from === currentChat._id && callState === 'idle') {
        setIncomingCall({ from: data.from, isVideo: data.isVideo });
        setCallState('ringing');
        setIsVideoCall(data.isVideo);
       
        const timeout = setTimeout(() => {
          declineCall();
        }, 30000);
        setCallTimeout(timeout);
      }
    };

    const handleCallAccept = (data: { from: string; timestamp: string }) => {
      if (data.from === currentChat._id) {
        setCallState('connected');
        if (callTimeout) {
          clearTimeout(callTimeout);
          setCallTimeout(null);
        }
      }
    };

    const handleCallEnd = (data: { from: string; timestamp: string }) => {
      if (data.from === currentChat._id) {
        endCall();
        toast.success('Call ended by other user');
      }
    };

    const handleCallDecline = (data: { from: string; timestamp: string }) => {
      if (data.from === currentChat._id) {
        endCall();
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
  }, [socket, currentChat, callState, callTimeout, declineCall, endCall]);

  // Initialize peer connection
  useEffect(() => {
    if (!socket || !currentChat) return;
    
    initializePeerConnection();
    
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [socket, currentChat, initializePeerConnection]);

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