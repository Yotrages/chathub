import React from 'react';
import { Phone, Video, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  currentChat: any;
  user: any;
  isUserOnline: boolean;
  typingUsers: string[];
  userStatuses: Map<string, { isOnline: boolean; username: string }>;
  callState: string;
  onStartCall: (isVideo: boolean) => void;
  onShowProfile: () => void;
  littlePhone: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentChat,
  user,
  isUserOnline,
  typingUsers,
  userStatuses,
  callState,
  onStartCall,
  onShowProfile,
  littlePhone
}) => {
  const renderStatus = () => {
    if (!isUserOnline) {
      return <span className="text-red-500">Offline</span>;
    }
    
    if (typingUsers.length > 0) {
      return <span className="text-blue-500">{`${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`}</span>;
    }

    if (currentChat.type === 'group') {
      return (
        <span>
          {currentChat.participants.length} members
          <span className="ml-2">
            {currentChat.participants.map((p: any) => {
              if (p._id === user?._id) return null;
              const status = userStatuses.get(p._id);
              return (
                <span key={p._id} className="ml-2">
                  <span className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-1 ${status?.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                    {status?.username}
                  </span>
                </span>
              );
            })}
          </span>
        </span>
      );
    }

    const peer = currentChat.participants.find((p: any) => p._id !== user?._id);
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
  };

  return (
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
              {renderStatus()}
            </p>
          </div>
        </div>
        
        <div className={`items-center ${littlePhone ? 'hidden' : 'flex'} space-x-2`}>
          {callState === 'idle' && (
            <>
              <button
                onClick={() => onStartCall(false)}
                className={`p-2 rounded-full transition-colors ${
                  isUserOnline
                    ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Voice call"
              >
                <Phone size={20} />
              </button>
              <button
                onClick={() => onStartCall(true)}
                className={`p-2 rounded-full transition-colors ${
                  isUserOnline
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
  );
};
