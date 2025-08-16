'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Paperclip, Image, Mic, MicOff, Smile, X, Pause, Play } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { RootState } from '@/libs/redux/store';
import { useChat } from '@/hooks/useChat';
import { clearReplyingTo } from '@/libs/redux/chatSlice';
import { toast } from 'react-hot-toast';

interface MessageInputProps {
  currentChat: any;
  onShowFileUpload: () => void;
}

export const MessageInput = ({ currentChat, onShowFileUpload }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('prompt');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isUserOnline, setIsUserOnline] = useState(navigator.onLine);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { replyingTo } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch();
  const { sendMessage, startTyping, stopTyping, uploadFile } = useChat();
  const little_Phone = screen.width < 320;

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsUserOnline(true);
    const handleOffline = () => {
      setIsUserOnline(false);
      toast.error('Network error - You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      setIsMobile(mobileKeywords.some((keyword) => userAgent.includes(keyword)) || window.innerWidth <= 768);
    };

    const checkMicrophonePermission = async () => {
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicrophonePermission(result.state);
          result.addEventListener('change', () => setMicrophonePermission(result.state));
        } catch (error) {
          console.log('Permissions API not supported', error);
        }
      }
    };

    checkMobileDevice();
    checkMicrophonePermission();
    const handleResize = () => checkMobileDevice();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    return () => {
      if (recordingTimer) clearInterval(recordingTimer);
      if (typingTimeout) clearTimeout(typingTimeout);
      if (currentChat?._id) stopTyping(currentChat._id);
    };
  }, [recordingTimer, typingTimeout, currentChat?._id, stopTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is online before sending
    if (!isUserOnline) {
      toast.error('Network error - Please check your connection');
      return;
    }

    if (message.trim() && currentChat?._id) {
      try {
        await sendMessage(
          currentChat._id,
          message.trim(),
          'text',
          undefined,
          undefined,
          replyingTo ? replyingTo.messageId : undefined
        );
        setMessage('');
        stopTyping(currentChat._id);
        if (replyingTo) dispatch(clearReplyingTo());
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message');
      }
    }
  };

  const handleTyping = useCallback(() => {
    if (!currentChat?._id || !isUserOnline) return;
    
    startTyping(currentChat._id);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => stopTyping(currentChat._id), 3000);
    setTypingTimeout(timeout);
  }, [currentChat?._id, startTyping, stopTyping, isUserOnline, typingTimeout]);

  const handleInputBlur = useCallback(() => {
    if (currentChat?._id && isUserOnline) {
      stopTyping(currentChat._id);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  }, [currentChat?._id, stopTyping, typingTimeout, isUserOnline]);

  const handleFileUpload = async (file: File, caption: string) => {
    if (!currentChat?._id) return;
    
    // Check if user is online before uploading
    if (!isUserOnline) {
      toast.error('Network error - Please check your connection');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', file.type);
      const data = await uploadFile(formData);
      let fileType: any;
      if (data.fileType.startsWith('image/')) {
        fileType = 'image';
      } else if (data.fileType.startsWith('video/')) {
        fileType = 'video';
      } else if (data.fileType.startsWith('audio/')) {
        fileType = 'audio';
      } else {
        fileType = 'file';
      }
      await sendMessage(
        currentChat._id,
        caption ? caption : file.name,
        fileType,
        data.fileUrl,
        file.name,
        replyingTo ? replyingTo.messageId : undefined
      );
      if (replyingTo) dispatch(clearReplyingTo());
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('File upload failed');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, '');
  };

  const requestMicrophonePermission = async () => {
    try {
      setMicrophonePermission('checking');
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission('granted');
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error: any) {
      setMicrophonePermission('denied');
      if (error.name === 'NotAllowedError') {
        setPermissionError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Microphone is already in use by another application.');
      } else {
        setPermissionError('Failed to access microphone. Please try again.');
      }
      return false;
    }
  };

  const startRecording = async () => {
    // Check if user is online before starting recording
    // if (!isUserOnline) {
    //   toast.error('Network error - Please check your connection');
    //   return;
    // }

    if (microphonePermission !== 'granted') {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;
    }

    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          setRecordedChunks(prev => [...prev, e.data]);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks || recordedChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_message_${Date.now()}.mp3`, { type: 'audio/mp3' });
        
        // Only upload if user is still online
        if (isUserOnline) {
          await handleFileUpload(audioFile, 'Voice message');
        } else {
          toast.error('Network error - Voice message not sent');
        }
        
        stream.getTracks().forEach((track) => track.stop());
      };
      
      recorder.start(1000); // Record in 1-second chunks for pause/resume functionality
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      setRecordedChunks([]);
      
      // Start the timer
      const timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
      
      if ('vibrate' in navigator && isMobile) navigator.vibrate(50);
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      if (error.name === 'NotAllowedError') {
        setPermissionError('Microphone access denied. Please allow microphone access and try again.');
        setMicrophonePermission('denied');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No microphone found. Please connect a microphone and try again.');
      } else {
        setPermissionError('Failed to start recording. Please try again.');
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
      
      // Pause the timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      if ('vibrate' in navigator && isMobile) navigator.vibrate(50);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      
      // Resume the timer
      const timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
      
      if ('vibrate' in navigator && isMobile) navigator.vibrate(50);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      setMediaRecorder(null);
      setRecordingDuration(0);
      setRecordedChunks([]);
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      if ('vibrate' in navigator && isMobile) navigator.vibrate(100);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      // Stop recording without triggering the onstop event
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      setMediaRecorder(null);
      setRecordingDuration(0);
      setRecordedChunks([]);
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      
      if ('vibrate' in navigator && isMobile) navigator.vibrate(100);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    e.preventDefault();
    const touchStartTime = Date.now();
    const longPressTimer = setTimeout(() => startRecording(), 200);
    
    const handleTouchEnd = () => {
      clearTimeout(longPressTimer);
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 200 && !isRecording) {
        startRecording();
      } else if (isRecording && !isPaused) {
        stopRecording();
      }
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  };

  const PermissionStatus = () => {
    if (microphonePermission === 'checking') {
      return (
        <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
          <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking microphone permissions...</span>
        </div>
      );
    }
    if (permissionError) {
      return (
        <div className="px-3 py-2 bg-red-50 text-red-800 rounded-lg text-sm">
          <div className="flex items-center justify-between">
            <span>{permissionError}</span>
            {microphonePermission === 'denied' && (
              <button
                onClick={requestMicrophonePermission}
                className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const cursorPosition = inputRef.current?.selectionStart || message.length;
    const newMessage = message.slice(0, cursorPosition) + emoji + message.slice(cursorPosition);
    setMessage(newMessage);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
        inputRef.current.focus();
      }
    }, 0);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <PermissionStatus />
      
      {/* Recording Controls */}
      {isRecording && (
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg mb-3 border border-red-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600 font-medium">
              {isPaused ? 'Paused' : 'Recording'}: {formatRecordingTime(recordingDuration)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            
            <button
              onClick={cancelRecording}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded-full hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={stopRecording}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition-colors"
            >
              Stop & Send
            </button>
          </div>
        </div>
      )}
      
      {/* Reply Section */}
      {replyingTo && (
        <div className="bg-gray-100 p-3 rounded-lg mb-3 relative">
          <div className="flex items-start space-x-2">
            <div className="w-1 bg-blue-500 rounded-full h-12"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                {typeof replyingTo.sender === 'string' ? replyingTo.sender : replyingTo.sender.username}
              </p>
              <p className="text-sm text-gray-500 line-clamp-2">{replyingTo.content}</p>
            </div>
            <button
              onClick={() => dispatch(clearReplyingTo())}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className={`absolute z-50 ${isMobile ? 'bottom-16 left-2 right-2' : 'bottom-16 right-4'}`}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={isMobile ? window.innerWidth - 32 : 350}
            height={isMobile ? 350 : 400}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
      
      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors ${little_Phone ? 'hidden' : 'flex'}`}
        >
          <Paperclip size={20} />
        </button>
        
        <button
          type="button"
          onClick={onShowFileUpload}
          className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors ${little_Phone ? 'hidden' : 'flex'}`}
        >
          <Image size={20} />
        </button>
        
        <button
          type="button"
          onClick={isMobile ? undefined : isRecording ? stopRecording : startRecording}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          disabled={microphonePermission === 'checking' || (microphonePermission === 'denied' && !permissionError)}
          className={`p-2 rounded-full transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg scale-110'
              : microphonePermission === 'denied' || !isUserOnline
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:scale-95'
          } ${little_Phone ? 'hidden' : 'flex'} ${isMobile ? 'select-none' : ''}`}
          title={isMobile ? 'Tap to start recording, release to send' : 'Click to start/stop recording'}
        >
          {microphonePermission === 'checking' ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : isRecording ? (
            <MicOff size={20} />
          ) : (
            <Mic size={20} />
          )}
        </button>
        
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onBlur={handleInputBlur}
            placeholder={`Message ${currentChat.name}...`}
            className={`w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isMobile ? 'text-16px' : ''}`}
            style={isMobile ? { fontSize: '16px' } : {}}
            disabled={isRecording || !isUserOnline}
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded-full transition-colors ${isMobile ? 'active:scale-95' : ''}`}
          >
            <Smile size={18} />
          </button>
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || isRecording || !isUserOnline}
          className={`p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${isMobile ? 'active:scale-95' : ''}`}
        >
          <Send size={20} />
        </button>
      </form>
      
      {/* Mobile Instructions */}
      {isMobile && microphonePermission === 'granted' && !isRecording && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">Tap and hold the microphone to record voice messages</p>
        </div>
      )}
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};