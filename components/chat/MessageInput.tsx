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
  const [microphonePermission, setMicrophonePermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('prompt');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isUserOnline, setIsUserOnline] = useState(navigator.onLine);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { replyingTo } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch();
  const { sendMessage, startTyping, stopTyping, uploadFile } = useChat();

  useEffect(() => {
    const handleOnline = () => setIsUserOnline(true);
    const handleOffline = () => {
      setIsUserOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkResponsiveLayout = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      
      const isSmallScreen = width <= 632;
      const isMobileDevice = mobileKeywords.some((keyword) => userAgent.includes(keyword));
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(isMobileDevice || isSmallScreen || isTouchDevice);
      setIsVerySmallScreen(width <= 250);
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

    checkResponsiveLayout();
    checkMicrophonePermission();
    
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkResponsiveLayout, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', checkResponsiveLayout);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkResponsiveLayout);
      clearTimeout(resizeTimeout);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      if (message.trim() === '') {
        textarea.style.height = 'auto';
        const computedStyle = window.getComputedStyle(textarea);
        const singleLineHeight = parseFloat(computedStyle.lineHeight) || 20;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        textarea.style.height = (singleLineHeight + paddingTop + paddingBottom) + 'px';
      } else {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const maxHeight = 120;
        textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
      }
    }
  }, [message]);

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
      if (typingTimeout) clearTimeout(typingTimeout);
      if (currentChat?._id) stopTyping(currentChat._id);
    };
  }, [typingTimeout, currentChat?._id, stopTyping]);

  const calculateRecordingDuration = useCallback(() => {
    if (!recordingStartTime) return 0;
    const now = Date.now();
    const totalElapsed = now - recordingStartTime;
    const actualDuration = Math.floor((totalElapsed - pausedDuration) / 1000);
    return Math.max(0, actualDuration);
  }, [recordingStartTime, pausedDuration]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(calculateRecordingDuration());
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, calculateRecordingDuration]);

  const getEmojiPickerStyles = () => {
    const width = window.innerWidth;
    if (width <= 320) {
      return {
        width: width - 16,
        height: 250,
        bottom: '5rem',
        left: '8px',
        right: '8px'
      };
    } else if (width <= 480) {
      return {
        width: width - 24,
        height: 280,
        bottom: '5rem',
        left: '12px',
        right: '12px'
      };
    } else if (width <= 632) {
      return {
        width: Math.min(350, width - 32),
        height: 320,
        bottom: '5rem',
        left: '16px',
        right: '16px'
      };
    } else {
      return {
        width: 350,
        height: 400,
        bottom: '5rem',
        right: '16px'
      };
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    setIsInputFocused(false);
    if (currentChat?._id && isUserOnline) {
      stopTyping(currentChat._id);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  }, [currentChat?._id, stopTyping, typingTimeout, isUserOnline]);

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
  }, []);

  const handleFileUpload = async (file: File, caption: string) => {
    if (!currentChat?._id) return;
    
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
        
        if (isUserOnline) {
          await handleFileUpload(audioFile, 'Voice message');
        } else {
          toast.error('Network error - Voice message not sent');
        }
        
        stream.getTracks().forEach((track) => track.stop());
      };
      
      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setIsPaused(false);
      
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      setRecordingDuration(0);
      setPausedDuration(0);
      setPauseStartTime(null);
      setRecordedChunks([]);
      
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
      setPauseStartTime(Date.now());
      if ('vibrate' in navigator && isMobile) navigator.vibrate(50);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
      if (pauseStartTime) {
        setPausedDuration(prev => prev + (Date.now() - pauseStartTime));
        setPauseStartTime(null);
      }
      if ('vibrate' in navigator && isMobile) navigator.vibrate(50);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      setMediaRecorder(null);
      setRecordingStartTime(null);
      setRecordingDuration(0);
      setPausedDuration(0);
      setPauseStartTime(null);
      setRecordedChunks([]);
      if ('vibrate' in navigator && isMobile) navigator.vibrate(100);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = () => {};
      mediaRecorder.ondataavailable = () => {};
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      setMediaRecorder(null);
      setRecordingStartTime(null);
      setRecordingDuration(0);
      setPausedDuration(0);
      setPauseStartTime(null);
      setRecordedChunks([]);
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

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const newMessage = message.slice(0, cursorPosition) + emoji + message.slice(cursorPosition);
    setMessage(newMessage);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const PermissionStatus = () => {
    if (microphonePermission === 'checking') {
      return (
        <div className="flex items-center space-x-2 px-2 py-1 bg-yellow-50 text-yellow-800 rounded-lg text-xs mb-2">
          <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Checking microphone permissions...</span>
        </div>
      );
    }
    if (permissionError) {
      return (
        <div className="px-2 py-1 bg-red-50 text-red-800 rounded-lg text-xs mb-2">
          <div className="flex items-center justify-between">
            <span className="flex-1 break-words">{permissionError}</span>
            {microphonePermission === 'denied' && (
              <button
                onClick={requestMicrophonePermission}
                className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors flex-shrink-0"
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

  const shouldHideUploaders = isMobile && isInputFocused && message.trim().length > 0;
  const shouldShowRecorders = !isVerySmallScreen || !shouldHideUploaders;

  return (
   <div 
    ref={containerRef}
    className="surface-primary border-t z-50 w-full"
     style={{
    paddingBottom: 'env(safe-area-inset-bottom, 0)',
    marginBottom: 0
  }}
  >
      <div className="px-0.5 xs:px-2 py-2 max-w-full">
        <PermissionStatus />
        
        {/* Recording Controls */}
        {isRecording && (
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg mb-2 border border-red-200">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span className="text-xs text-red-600 font-medium truncate">
                {isPaused ? 'Paused' : 'Recording'}: {formatRecordingTime(recordingDuration)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="p-1 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors active:scale-95"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
              
              <button
                onClick={cancelRecording}
                className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full hover:bg-gray-600 transition-colors active:scale-95"
              >
                Cancel
              </button>
              
              <button
                onClick={stopRecording}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors active:scale-95"
              >
                Send
              </button>
            </div>
          </div>
        )}
        
        {/* Reply Section */}
        {replyingTo && (
          <div className="bg-gray-100 p-2 rounded-lg mb-2 relative">
            <div className="flex items-start space-x-2">
              <div className="w-1 bg-blue-500 rounded-full h-10 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {typeof replyingTo.sender === 'string' ? replyingTo.sender : replyingTo.sender.username}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2 break-words">{replyingTo.content}</p>
              </div>
              <button
                onClick={() => dispatch(clearReplyingTo())}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors active:scale-95 flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute z-[150]"
            style={getEmojiPickerStyles()}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={getEmojiPickerStyles().width}
              height={getEmojiPickerStyles().height}
              searchDisabled={isVerySmallScreen}
              skinTonesDisabled={isVerySmallScreen}
              previewConfig={{ showPreview: !isVerySmallScreen }}
            />
          </div>
        )}
        
        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-1 w-full">
          {/* File Upload Buttons - Hidden when typing on mobile */}
          {!shouldHideUploaders && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:flex hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors active:scale-95 flex-shrink-0"
                title="Attach file"
              >
                <Paperclip size={isVerySmallScreen ? 16 : 18} />
              </button>
              
              <button
                type="button"
                onClick={onShowFileUpload}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors active:scale-95 flex-shrink-0"
                title="Send image"
              >
                <Image size={isVerySmallScreen ? 16 : 18} />
              </button>
            </>
          )}
          
          {/* Message Input Container */}
          <div className="flex-1 relative pl-0.5 min-w-0">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={`Message ${currentChat?.name || 'chat'}...`}
                className="w-full placeholder:truncate px-3 py-2 pr-10 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none overflow-hidden"
                style={{
                  fontSize: isMobile ? '16px' : '14px',
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
                disabled={isRecording || !isUserOnline}
                rows={1}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 bottom-2 p-1 text-gray-500 dark:text-white hover:text-gray-700 rounded-full transition-colors active:scale-95 flex-shrink-0"
                title="Add emoji"
              >
                <Smile size={isVerySmallScreen ? 14 : 16} />
              </button>
            </div>
          </div>
          
          {/* Voice Recording Button */}
          {shouldShowRecorders && (
            <button
              type="button"
              onClick={isMobile ? undefined : isRecording ? stopRecording : startRecording}
              onTouchStart={isMobile ? handleTouchStart : undefined}
              disabled={microphonePermission === 'checking' || (microphonePermission === 'denied' && !permissionError)}
              className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg scale-110'
                  : microphonePermission === 'denied' || !isUserOnline
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:scale-95'
              } ${isMobile ? 'select-none' : ''}`}
              title={isMobile ? 'Tap to record' : 'Click to record'}
            >
              {microphonePermission === 'checking' ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : isRecording ? (
                <MicOff size={isVerySmallScreen ? 16 : 18} />
              ) : (
                <Mic size={isVerySmallScreen ? 16 : 18} />
              )}
            </button>
          )}
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isRecording || !isUserOnline}
            className="p-2 bg-blue-500 flex items-center justify-center text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
            title="Send message"
          >
            <Send size={isVerySmallScreen ? 16 : 18} />
          </button>
        </form>
        
        {/* Mobile Instructions */}
        {/* {isMobile && microphonePermission === 'granted' && !isRecording && shouldShowRecorders && (
          <div className="mt-1 text-center">
            <p className="text-xs text-gray-500">Tap and hold mic to record</p>
          </div>
        )} */}
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};