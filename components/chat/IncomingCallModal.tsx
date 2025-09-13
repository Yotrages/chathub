import { Phone, PhoneOff } from 'lucide-react';

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
  if (!incomingCall || callState !== 'ringing') return null;

  return (
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
              onClick={onDecline}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <PhoneOff size={20} className="mr-2" />
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <Phone size={20} className="mr-2" />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};