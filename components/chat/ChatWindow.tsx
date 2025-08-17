'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Phone, 
  Video, 
  MoreVertical, 
  PhoneOff, 
  VideoOff, 
  Mic, 
  MicOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { RootState } from '@/libs/redux/store';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { FileUpload } from './FileUpload';
import { MessageInput } from './MessageInput';
import { useSocket } from '@/context/socketContext';
import toast from 'react-hot-toast';
import { api } from '@/libs/axios/config';

interface ChatWindowProps {
  onShowProfile: () => void;
}

type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';
type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export const ChatWindow = ({ onShowProfile }: ChatWindowProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loadedChats, setLoadedChats] = useState<Set<string>>(new Set());
  const [isUserOnline, setIsUserOnline] = useState(navigator.onLine);
  const [callState, setCallState] = useState<CallState>('idle');
  const [connectionState, setConnectionState] = useState<ConnectionState>('new');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [userStatuses, setUserStatuses] = useState<Map<string, { isOnline: boolean; username: string }>>(new Map());
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{from: string, isVideo: boolean} | null>(null);
  const [callTimeout, setCallTimeout] = useState<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { socket } = useSocket();
  const { activeChat, chats, messages } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const { loadMessages, joinChat, markMessagesAsRead } = useChat();

  const currentChat = chats.find((chat) => chat._id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];
  const little_Phone = screen.availWidth < 300;

  // Enhanced WebRTC Configuration with multiple STUN/TURN servers
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
  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }
    }, 1000);
  };

  // Stop call timer
  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);
  };

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
        // Attempt to reconnect
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
  }, [socket, currentChat, user?._id]);

  // Initialize peer connection
  useEffect(() => {
    if (!isUserOnline || !socket || !activeChat || !currentChat) return;
    initializePeerConnection();
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isUserOnline, socket, activeChat, initializePeerConnection]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsUserOnline(true);
      if (socket) {
        socket.emit('user_online');
      }
    };
    const handleOffline = () => {
      setIsUserOnline(false);
      if (socket) {
        socket.emit('user_offline');
      }
      // End call if user goes offline
      if (callState !== 'idle') {
        endCall();
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket, callState]);

  // User status handling (existing code...)
  useEffect(() => {
    if (!socket || !activeChat || !isUserOnline || !currentChat || !user) return;

    const handleUserStatusChange = ({ userId, online }: { userId: string; online: boolean }) => {
      if (currentChat.participants.some((p) => p._id === userId)) {
        setUserStatuses((prev) => {
          const newStatuses = new Map(prev);
          const existing = newStatuses.get(userId) || { username: '' };
          newStatuses.set(userId, { ...existing, isOnline: online });
          return newStatuses;
        });
      }
    };

    const handleUserOnline = async ({ userId }: { userId: string }) => {
      if (currentChat.participants.some((p) => p._id === userId)) {
        try {
          const response = await api.get(`/api/status/user/${userId}`);
          if (response.data.isOnline) {
            setUserStatuses((prev) => {
              const newStatuses = new Map(prev);
              const existing = newStatuses.get(userId) || { username: '' };
              newStatuses.set(userId, { ...existing, isOnline: true });
              return newStatuses;
            });
          }
        } catch (err) {
          console.error('Error fetching user status:', err);
        }
      }
    };

    const handleUserOffline = async ({ userId }: { userId: string }) => {
      if (currentChat.participants.some((p) => p._id === userId)) {
        setUserStatuses((prev) => {
          const newStatuses = new Map(prev);
          const existing = newStatuses.get(userId) || { username: '' };
          newStatuses.set(userId, { ...existing, isOnline: false });
          return newStatuses;
        });
        
        // End call if the other user goes offline
        if (callState !== 'idle') {
          endCall();
          toast.error('Call ended - user went offline');
        }
      }
    };

    socket.on('user_status_change', handleUserStatusChange);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    // Fetch initial statuses (existing code...)
    currentChat.participants.forEach(async (p) => {
      if (p._id !== user._id) {
        try {
          const response = await api.get(`/api/status/user/${p._id}`);
          setUserStatuses((prev) => {
            const newStatuses = new Map(prev);
            newStatuses.set(p._id, { isOnline: response.data.isOnline, username: p.username || p.name || 'Unknown' });
            return newStatuses;
          });
        } catch (err: any) {
          if (err.response?.status === 403) {
            setUserStatuses((prev) => {
              const newStatuses = new Map(prev);
              newStatuses.set(p._id, { isOnline: false, username: p.username || p.name || 'Unknown' });
              return newStatuses;
            });
          } else {
            console.error('Error fetching user status:', err);
          }
        }
      }
    });

    return () => {
      socket.off('user_status_change', handleUserStatusChange);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket, activeChat, isUserOnline, currentChat, user, callState]);

  // Load messages (existing code...)
  const loadChatMessages = useCallback(async (chatId: string) => {
    if (!isUserOnline) {
      console.log('User is offline, skipping message loading');
      return;
    }
    try {
      setIsLoading(true);
      await loadMessages(chatId);
      await markMessagesAsRead(chatId);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setLoadedChats((prev) => {
        const newSet = new Set(prev);
        newSet.delete(chatId);
        return newSet;
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages, markMessagesAsRead, isUserOnline]);

  // Handle activeChat changes (existing code...)
  useEffect(() => {
    if (!activeChat) return;
    if (!isUserOnline) {
      console.log('User is offline, skipping chat operations');
      return;
    }
    joinChat(activeChat);
    if (!loadedChats.has(activeChat)) {
      setLoadedChats((prev) => new Set([...prev, activeChat]));
      loadChatMessages(activeChat);
    } else {
      markMessagesAsRead(activeChat);
    }
  }, [activeChat, joinChat, loadChatMessages, loadedChats, isUserOnline]);

  // Auto-scroll (existing code...)
  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length]);

  // Handle typing indicators (existing code...)
  useEffect(() => {
    if (!socket || !activeChat || !isUserOnline) return;
    const handleTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat && data.userId !== user?._id) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    };
    const handleStopTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, activeChat, user?._id, isUserOnline]);

  // Enhanced call signaling
  useEffect(() => {
    if (!socket || !activeChat || !isUserOnline || !currentChat) return;

    const handleOffer = async (data: { sdp: RTCSessionDescriptionInit; from: string; isVideo: boolean }) => {
      if (data.from === currentChat._id && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          
          // Get user media for the call
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
        
        // Auto-decline after 30 seconds
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
        toast.custom('Call ended by other user');
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
  }, [socket, activeChat, isUserOnline, currentChat, callState, callTimeout]);

  // Start a call with enhanced error handling
  const startCall = async (isVideo: boolean = false) => {
    if (!isUserOnline || !currentChat || !socket) {
      toast.error('Cannot start call - you are offline');
      return;
    }

    if (currentChat.type === 'group') {
      toast.error('Group calls are not supported yet');
      return;
    }

    const validPeer = currentChat.participants.find((p) => p._id !== user?._id);
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

      // Initialize peer connection
      const pc = initializePeerConnection();
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });
      
      await pc.setLocalDescription(offer);
      
      // Send offer to peer
      socket.emit('offer', { sdp: offer, to: validPeer._id, isVideo });
      socket.emit('call_request', { to: validPeer._id, isVideo });

      // Set timeout for unanswered call
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
  };

  // Accept incoming call
  const acceptCall = () => {
    if (incomingCall && socket) {
      socket.emit('call_accept', { to: incomingCall.from });
      setIncomingCall(null);
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
    }
  };

  // Decline incoming call
  const declineCall = () => {
    if (incomingCall && socket) {
      socket.emit('call_decline', { to: incomingCall.from });
      setIncomingCall(null);
      setCallState('idle');
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
    }
  };

  // Toggle audio mute
  const toggleAudioMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video mute
  const toggleVideoMute = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  // Toggle remote audio
  const toggleRemoteAudio = () => {
    if (remoteStream) {
      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsRemoteAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Switch call type (voice to video or vice versa)
  const switchCallType = async () => {
    if (!peerConnectionRef.current || callState !== 'connected') return;
    
    try {
      const newIsVideo = !isVideoCall;
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: newIsVideo, 
        audio: true 
      });
      
      // Replace tracks
      const sender = peerConnectionRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (newIsVideo && !sender) {
        // Add video track
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          peerConnectionRef.current.addTrack(videoTrack, stream);
        }
      } else if (!newIsVideo && sender) {
        // Remove video track
        peerConnectionRef.current.removeTrack(sender);
      } else if (newIsVideo && sender) {
        // Replace video track
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
  };

  // End call with cleanup
  const endCall = () => {
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
    if (isUserOnline && socket && activeChat && currentChat) {
      setTimeout(() => {
        initializePeerConnection();
      }, 1000);
    }
  };

  if (!currentChat) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold">
                {currentChat.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentChat.name || 'Unknown Chat'}
              </h2>
              <p className="text-sm text-gray-500 flex items-center">
                {!isUserOnline ? (
                  <span className="text-red-500">Offline</span>
                ) : typingUsers.length > 0 ? (
                  <span className="text-blue-500">{`${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`}</span>
                ) : currentChat.type === 'group' ? (
                  <span>
                    {currentChat.participants.length} members
                    <span className="ml-2">
                      {currentChat.participants.map((p) => (
                        p._id !== user?._id && (
                          <span key={p._id} className="ml-2">
                            {userStatuses.get(p._id)?.isOnline ? (
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                {userStatuses.get(p._id)?.username}
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                                {userStatuses.get(p._id)?.username}
                              </span>
                            )}
                          </span>
                        )
                      ))}
                    </span>
                  </span>
                ) : (
                  (() => {
                    const peer = currentChat.participants.find((p) => p._id !== user?._id);
                    if (!peer) return <span>Click to view profile</span>;
                    const status = userStatuses.get(peer._id);
                    return status?.isOnline ? (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
                        Offline
                      </span>
                    );
                  })()
                )}
              </p>
            </div>
          </div>

          <div className={`items-center ${little_Phone ? 'hidden' : 'flex'} space-x-2`}>
            {callState === 'idle' && (
              <>
                <button
                  disabled={
                    !isUserOnline ||
                    !currentChat.participants.some((p) => p._id !== user?._id && userStatuses.get(p._id)?.isOnline)
                  }
                  onClick={() => startCall(false)}
                  className={`p-2 rounded-full transition-colors ${
                    isUserOnline &&
                    currentChat.participants.some((p) => p._id !== user?._id && userStatuses.get(p._id)?.isOnline)
                      ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  title="Voice call"
                >
                  <Phone size={20} />
                </button>
                <button
                  disabled={
                    !isUserOnline ||
                    !currentChat.participants.some((p) => p._id !== user?._id && userStatuses.get(p._id)?.isOnline)
                  }
                  onClick={() => startCall(true)}
                  className={`p-2 rounded-full transition-colors ${
                    isUserOnline &&
                    currentChat.participants.some((p) => p._id !== user?._id && userStatuses.get(p._id)?.isOnline)
                      ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  title="Video call"
                >
                  <Video size={20} />
                </button>
              </>
            )}
            <button
              onClick={onShowProfile}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="More options"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && callState === 'ringing' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-semibold">
                  {currentChat.name?.charAt(0) || 'U'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call
              </h3>
              <p className="text-gray-600 mb-6">{currentChat.name}</p>
              <div className="flex space-x-4">
                <button
                  onClick={declineCall}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                >
                  <PhoneOff size={20} className="mr-2" />
                  Decline
                </button>
                <button
                  onClick={acceptCall}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                >
                  <Phone size={20} className="mr-2" />
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Interface */}
      {callState !== 'idle' && !incomingCall && (
        <div className={`bg-gray-900 text-white transition-all duration-300 ${
          isCallMinimized ? 'h-16' : isVideoCall ? 'h-80' : 'h-32'
        }`}>
          {/* Call Header */}
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
                onClick={() => setIsCallMinimized(!isCallMinimized)}
                className="p-1 text-gray-300 hover:text-white"
              >
                {isCallMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
            </div>
          </div>

          {!isCallMinimized && (
            <>
              {/* Error Display */}
              {callError && (
                <div className="bg-red-600 text-white px-4 py-2 text-sm">
                  {callError}
                </div>
              )}

              {/* Video Area */}
              {isVideoCall && (
                <div className="relative h-48 bg-black">
                  {/* Remote Video */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Local Video (Picture-in-Picture) */}
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
              )}

              {/* Audio-only Call Display */}
              {!isVideoCall && callState === 'connected' && (
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
              )}

              {/* Call Controls */}
              <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800">
                {/* Mute Audio */}
                <button
                  onClick={toggleAudioMute}
                  className={`p-3 rounded-full transition-colors ${
                    isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={isAudioMuted ? 'Unmute' : 'Mute'}
                >
                  {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* Toggle Video (if video call) */}
                {isVideoCall && (
                  <button
                    onClick={toggleVideoMute}
                    className={`p-3 rounded-full transition-colors ${
                      isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                    title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
                  >
                    {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>
                )}

                {/* Remote Audio Control */}
                <button
                  onClick={toggleRemoteAudio}
                  className={`p-3 rounded-full transition-colors ${
                    isRemoteAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={isRemoteAudioMuted ? 'Unmute remote' : 'Mute remote'}
                >
                  {isRemoteAudioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                {/* Switch Call Type */}
                {callState === 'connected' && (
                  <button
                    onClick={switchCallType}
                    className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                    title={isVideoCall ? 'Switch to voice' : 'Switch to video'}
                  >
                    {isVideoCall ? <Phone size={20} /> : <Video size={20} />}
                  </button>
                )}

                {/* End Call */}
                <button
                  onClick={endCall}
                  className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                  title="End call"
                >
                  <PhoneOff size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!isUserOnline && (
          <div className="text-center text-red-500 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm">You are currently offline. Messages will not load or send.</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading messages...</p>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">👋</div>
            <p>Start your conversation with {currentChat.name}</p>
            <p className="text-sm mt-1">Say hello and break the ice!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={
                typeof msg.senderId === 'string'
                  ? msg.senderId === user?._id
                  : msg.senderId._id === user?._id
              }
              showAvatar={
                index === 0 ||
                (typeof chatMessages[index - 1].senderId === 'string'
                  ? chatMessages[index - 1].senderId !==
                    (typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id)
                  : chatMessages[index - 1].senderId !==
                    (typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id))
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        currentChat={currentChat}
        onShowFileUpload={() => setShowFileUpload(true)}
      />

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onUpload={() => {
            // This will be handled in MessageInput
          }}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
};