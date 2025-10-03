import { Phone, PhoneOff, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

interface IncomingCallModalProps {
  incomingCall: { from: string; isVideo: boolean } | null;
  callState: string;
  currentChat: any;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal = ({
  incomingCall,
  callState,
  currentChat,
  onAccept,
  onDecline
}: IncomingCallModalProps) => {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (!incomingCall || callState !== 'ringing') {
      setTimeRemaining(30);
      setIsRinging(false);
      return;
    }

    setIsRinging(true);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onDecline();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      setTimeRemaining(30);
      setIsRinging(false);
    };
  }, [incomingCall, callState, onDecline]);

  if (!incomingCall || callState !== 'ringing') return null;

  const handleAccept = () => {
    setIsRinging(false);
    onAccept();
  };

  const handleDecline = () => {
    setIsRinging(false);
    onDecline();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000]">
      {/* Ripple animation background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full border-4 border-blue-400 opacity-20 animate-ping"></div>
        <div className="absolute w-48 h-48 rounded-full border-4 border-blue-400 opacity-30 animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute w-32 h-32 rounded-full border-4 border-blue-400 opacity-40 animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Timer */}
          <div className="absolute top-4 right-4 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
            {timeRemaining}s
          </div>
          
          {/* User Avatar */}
          <div className="relative mx-auto mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-semibold">
                {currentChat.name?.charAt(0) || 'U'}
              </span>
            </div>
            {/* Ringing animation */}
            {isRinging && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-pulse opacity-60"></div>
            )}
          </div>
          
          {/* Call info */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call
          </h3>
          <p className="text-gray-600 mb-2 text-lg">{currentChat.name}</p>
          <div className="flex items-center justify-center mb-6">
            {incomingCall.isVideo ? (
              <Video size={20} className="mr-2 text-blue-500" />
            ) : (
              <Phone size={20} className="mr-2 text-green-500" />
            )}
            <span className="text-sm text-gray-500">
              {incomingCall.isVideo ? 'Video call' : 'Voice call'}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-center space-x-8">
            {/* Decline button */}
            <button
              onClick={handleDecline}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center group"
              title="Decline call"
            >
              <PhoneOff size={24} className="group-hover:animate-pulse" />
            </button>
            
            {/* Accept button */}
            <button
              onClick={handleAccept}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center group"
              title="Accept call"
            >
              {incomingCall.isVideo ? (
                <Video size={24} className="group-hover:animate-pulse" />
              ) : (
                <Phone size={24} className="group-hover:animate-pulse" />
              )}
            </button>
          </div>
          
          {/* Quick action hints */}
          <div className="mt-4 text-xs text-gray-400">
            <p>Call will auto-decline in {timeRemaining} seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
};