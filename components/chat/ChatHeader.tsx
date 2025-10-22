import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { Chat, UserStatus } from '@/types';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { UserAvatar } from '../constant/UserAvatar';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  currentChat: Chat;
  typingUsers: string[];
  userStatuses: Map<string, UserStatus>;
  callState: string;
  onShowProfile: () => void;
  onStartCall: (isVideo: boolean) => void;
}

export const ChatHeader = ({
  currentChat,
  typingUsers,
  userStatuses,
  callState,
  onShowProfile,
  onStartCall
}: ChatHeaderProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  
  const otherUserId = currentChat.participants.find((u) => u._id !== user?._id);
  
  const getOtherUserOnlineStatus = () => {
    if (currentChat.type === 'group') {
      return false;
    }
    
    const otherUser = currentChat.participants.find((p: any) => p._id !== user?._id);
    if (!otherUser) return false;
    
    const status = userStatuses.get(otherUser._id);
    return status?.isOnline || false;
  };

  const isOtherUserOnline = getOtherUserOnlineStatus();

  const renderStatus = () => {
    if (typingUsers.length > 0) {
      return (
        <span className="text-blue-500 text-xs sm:text-sm truncate">
          {`${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`}
        </span>
      );
    }

    if (currentChat.type === 'group') {
      return (
        <div className="flex items-center text-xs sm:text-sm">
          <span className="truncate">
            {currentChat.participants.length} members
          </span>
          <div className="ml-2 flex items-center overflow-hidden">
            {currentChat.participants.slice(0, 3).map((p: any) => (
              p._id !== user?._id && (
                <UserStatusIndicator 
                  key={p._id} 
                  userId={p._id} 
                  userStatuses={userStatuses} 
                />
              )
            ))}
            {currentChat.participants.length > 4 && (
              <span className="text-xs text-gray-400 ml-1">...</span>
            )}
          </div>
        </div>
      );
    }

    return isOtherUserOnline ? (
      <span className="flex items-center text-xs sm:text-sm">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 flex-shrink-0"></span>
        <span className="truncate">Online</span>
      </span>
    ) : (
      <span className="flex items-center text-xs sm:text-sm">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full mr-1 flex-shrink-0"></span>
        <span className="truncate">Offline</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
      <div className="flex items-center justify-between min-w-0">

          <button onClick={() => router.push('/chat')} className={`${window.location.pathname.includes('message') ? 'flex' : 'hidden'} p-2 bg-black dark:bg-white items-center justify-center rounded-full transition-all duration-200 mr-3`}>
            <ArrowLeft size={18}/>
          </button>
        {/* Left side - Avatar and info */}
        <div className="flex items-center min-w-0 flex-1 mr-2">
            <UserAvatar 
              avatar={currentChat.avatar} 
              username={currentChat.name} 
              className='w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 mr-2 sm:mr-3'
            />
         
          <div className="min-w-0 flex-1">
            <h2 
              onClick={() => currentChat.type !== 'group' && router.push(`/profile/${otherUserId?._id}`)} 
              className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 truncate leading-tight"
              title={currentChat.name || 'Unknown Chat'}
            >
              {currentChat.name || 'Unknown Chat'}
            </h2>
            <div className="text-gray-500 min-w-0 mt-0.5">
              {renderStatus()}
            </div>
          </div>
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {callState === 'idle' && (
            <>
              <button
                onClick={() => onStartCall(false)}
                className={`p-1.5 sm:p-2 rounded-full transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100`}
                // disabled={!isOtherUserOnline}
                title={"Voice call"}
              >
                <Phone size={20} className="w-5 h-5" />
              </button>
              
              {/* Video call button */}
              <button
                onClick={() => onStartCall(true)}
                className={`p-1.5 sm:p-2 rounded-full transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100 `}
                // disabled={!isOtherUserOnline}
                title={"Video call"}
              >
                <Video size={20} className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* More options button */}
          <button
            onClick={onShowProfile}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="More options"
          >
            <MoreVertical size={20} className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const UserStatusIndicator = ({ 
  userId, 
  userStatuses 
}: { 
  userId: string; 
  userStatuses: Map<string, UserStatus> 
}) => {
  const status = userStatuses.get(userId);
  return (
    <span className="inline-flex items-center ml-1 sm:ml-2 min-w-0">
      <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 flex-shrink-0 ${
        status?.isOnline ? 'bg-green-500' : 'bg-gray-500'
      }`}></span>
      <span className="text-xs truncate max-w-16 sm:max-w-20" title={status?.username || 'Unknown'}>
        {status?.username || 'Unknown'}
      </span>
    </span>
  );
};