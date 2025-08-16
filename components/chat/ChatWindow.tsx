'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Phone, Video, MoreVertical } from 'lucide-react';
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

export const ChatWindow = ({ onShowProfile }: ChatWindowProps) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loadedChats, setLoadedChats] = useState<Set<string>>(new Set());
  const [isUserOnline, setIsUserOnline] = useState(navigator.onLine);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [userStatuses, setUserStatuses] = useState<Map<string, { isOnline: boolean; username: string }>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const { socket } = useSocket();
  const { activeChat, chats, messages } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  const { loadMessages, joinChat, markMessagesAsRead } = useChat();

  const currentChat = chats.find((chat) => chat._id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];
  const little_Phone = screen.availWidth < 300;

  // WebRTC Configuration with TURN (for better connectivity)
  const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, // Keep the default STUN
    { urls: 'stun:jb-turn1.xirsys.com' }, // Add the Xirsys STUN
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
};

  // Initialize peer connection
  useEffect(() => {
    if (!isUserOnline || !socket || !activeChat || !currentChat) return;

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && peerConnectionRef.current) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: currentChat._id });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current.oniceconnectionstatechange = () => {
      if (peerConnectionRef.current?.iceConnectionState === 'failed') {
        setCallError('Call connection failed. Please try again.');
        endCall();
      }
    };

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isUserOnline, socket, activeChat]);

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
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [socket]);

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
      }
    };

    socket.on('user_status_change', handleUserStatusChange);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    // Fetch initial statuses
    currentChat.participants.forEach(async (p) => {
      if (p._id !== user.id) {
        try {
          const response = await api.get(`/api/status/user/${p._id}`);
          setUserStatuses((prev) => {
            const newStatuses = new Map(prev);
            newStatuses.set(p._id, { isOnline: response.data.isOnline, username: p.username || p.name || 'Unknown' });
            return newStatuses;
          });
        } catch (err: any) {
          if (err.response?.status === 403) {
            // User has hidden status or is blocked
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
  }, [socket, activeChat, isUserOnline, currentChat, user]);

  // Load messages
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

  // Handle activeChat changes
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

  // Auto-scroll
  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length]);

  // Handle typing indicators
  useEffect(() => {
    if (!socket || !activeChat || !isUserOnline) return;
    const handleTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === activeChat && data.userId !== user?.id) {
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
  }, [socket, activeChat, user?.id, isUserOnline]);

  // Handle call signaling
  useEffect(() => {
    if (!socket || !activeChat || !isUserOnline || !currentChat) return;

    const handleOffer = (data: { sdp: RTCSessionDescriptionInit; from: string }) => {
      if (data.from === currentChat._id && peerConnectionRef.current) {
        setCallState('ringing');
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        peerConnectionRef.current.createAnswer().then((answer) => {
          peerConnectionRef.current?.setLocalDescription(answer);
          socket.emit('answer', { sdp: answer, to: data.from });
          setCallState('connected');
        }).catch((err) => {
          console.error('Answer creation failed:', err);
          setCallError('Failed to accept call');
        });
      }
    };

    const handleIceCandidate = (data: { candidate: RTCIceCandidateInit; from: string }) => {
      if (data.from === currentChat._id && peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch((err) => {
          console.error('ICE candidate error:', err);
        });
      }
    };

    const handleCallRequest = (data: { from: string; isVideo: boolean; timestamp: string }) => {
      if (data.from === currentChat._id) {
        setCallState('ringing');
        setIsVideoCall(data.isVideo);
        // Auto-accept for demo; in production, prompt user
        startCall();
      }
    };

    const handleCallAccept = (data: { from: string; timestamp: string }) => {
      if (data.from === currentChat._id) {
        setCallState('connected');
      }
    };

    const handleCallEnd = (data: { from: string; timestamp: string }) => {
      if (data.from === currentChat._id) {
        endCall();
      }
    };

    socket.on('offer', handleOffer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call_request', handleCallRequest);
    socket.on('call_accept', handleCallAccept);
    socket.on('call_end', handleCallEnd);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call_request', handleCallRequest);
      socket.off('call_accept', handleCallAccept);
      socket.off('call_end', handleCallEnd);
    };
  }, [socket, activeChat, isUserOnline]);

  // Start a call
  const startCall = async () => {
    if (!isUserOnline || !peerConnectionRef.current || !navigator.mediaDevices || !currentChat) return;
    if (currentChat.type === 'group' && !confirm('Group calls require MCU/SFU setup. Proceed with first participant?')) return;

    const validPeer = currentChat.participants.find((p) => p._id !== user?.id);
    if (!validPeer) {
      setCallError('No valid peer to call');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall,
      }).catch((err) => {
        let message = 'Microphone/Camera access denied.';
      if (err.name === 'NotAllowedError') message += ' Please allow permissions in browser settings.';
      else if (err.name === 'NotFoundError') message += ' No camera/microphone detected.';
      else if (err.name === 'NotSupportedError') message += ' Browser does not support this feature.';
      setCallError(message);
      toast.error(message)
      return null;
      });
      if (!stream || !socket) return;

      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => peerConnectionRef.current?.addTrack(track, stream));

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket.emit('offer', { sdp: offer, to: validPeer });
      socket.emit('call_request', { to: validPeer, isVideo: isVideoCall });
      setCallState('calling');

      // Ringing timeout
      setTimeout(() => {
        if (callState === 'calling') {
          setCallError('Call not answered. Ending call.');
          endCall();
        }
      }, 30000); // 30 seconds timeout
    } catch (error) {
      console.error('Error starting call:', error);
      setCallError('Failed to start call');
      setCallState('idle');
    }
  };

  // Switch call type (voice to video or vice versa)
  const switchCallType = async () => {
    if (!peerConnectionRef.current || callState !== 'connected') return;
    setIsVideoCall((prev) => !prev);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: !isVideoCall, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => {
        if (track.kind === (isVideoCall ? 'video' : 'audio')) {
          track.enabled = !track.enabled;
        } else {
          peerConnectionRef.current?.addTrack(track, stream);
        }
      });
    } catch (error) {
    console.log(error)
      setCallError('Failed to switch call type');
    }
  };

  // End call
  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setCallState('idle');
    if (localVideoRef.current?.srcObject) {
      (localVideoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
    }
    if (currentChat && socket) {
      socket.emit('call_end', { to: currentChat._id });
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
                  <span>Offline</span>
                ) : typingUsers.length > 0 ? (
                  <span>{`${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`}</span>
                ) : currentChat.type === 'group' ? (
                  <span>
                    {currentChat.participants.length} members
                    <span className="ml-2">
                      {currentChat.participants.map((p) => (
                        p._id !== user?.id && (
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
                    const peer = currentChat.participants.find((p) => p._id !== user?.id);
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
            <button
              disabled={
                !isUserOnline ||
                callState !== 'idle' ||
                !currentChat.participants.some((p) => p._id !== user?.id && userStatuses.get(p._id)?.isOnline)
              }
              onClick={() => {
                setIsVideoCall(false);
                startCall();
              }}
              className={`p-2 rounded-full transition-colors ${
                isUserOnline &&
                callState === 'idle' &&
                currentChat.participants.some((p) => p._id !== user?.id && userStatuses.get(p._id)?.isOnline)
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <Phone size={20} />
            </button>
            <button
              disabled={
                !isUserOnline ||
                callState !== 'idle' ||
                !currentChat.participants.some((p) => p._id !== user?.id && userStatuses.get(p._id)?.isOnline)
              }
              onClick={() => {
                setIsVideoCall(true);
                startCall();
              }}
              className={`p-2 rounded-full transition-colors ${
                isUserOnline &&
                callState === 'idle' &&
                currentChat.participants.some((p) => p._id !== user?.id && userStatuses.get(p._id)?.isOnline)
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <Video size={20} />
            </button>
            <button
              onClick={onShowProfile}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Call Interface */}
      {callState !== 'idle' && (
        <div className="bg-gray-100 p-4 flex flex-col items-center">
          {callError && <p className="text-red-500 mb-2">{callError}</p>}
          <video ref={localVideoRef} autoPlay muted className="w-1/4 rounded-lg mb-2" />
          <video ref={remoteVideoRef} autoPlay className="w-1/2 rounded-lg" />
          <div className="mt-4 space-x-4">
            {callState === 'connected' && (
              <button
                onClick={switchCallType}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
              >
                {isVideoCall ? 'Switch to Voice' : 'Switch to Video'}
              </button>
            )}
            <button
              onClick={endCall}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              End Call
            </button>
          </div>
          {callState === 'ringing' && <p className="text-gray-600 mt-2">Ringing...</p>}
          {callState === 'calling' && <p className="text-gray-600 mt-2">Calling...</p>}
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
                  ? msg.senderId === user?.id
                  : msg.senderId._id === user?.id
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