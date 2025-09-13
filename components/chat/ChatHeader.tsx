import { Phone, Video, MoreVertical } from 'lucide-react';
import { Chat, UserStatus } from '@/types';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { UserAvatar } from '../constant/UserAvatar';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  currentChat: Chat;
  isUserOnline: boolean;
  typingUsers: string[];
  userStatuses: Map<string, UserStatus>;
  callState: string;
  onShowProfile: () => void;
  onStartCall: (isVideo: boolean) => void;
}

export const ChatHeader = ({
  currentChat,
  isUserOnline,
  typingUsers,
  userStatuses,
  callState,
  onShowProfile,
  onStartCall
}: ChatHeaderProps) => {
  const little_Phone = screen.availWidth < 300;
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter()
  const otherUserId = currentChat.participants.find((u) => u._id !== user?._id)
  const renderStatus = () => {
    if (!isUserOnline) {
      return <span className="text-red-500">Offline</span>;
    }
    
    if (typingUsers.length > 0) {
      return (
        <span className="text-blue-500">
          {`${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`}
        </span>
      );
    }

    if (currentChat.type === 'group') {
      return (
        <span>
          {currentChat.participants.length} members
          <span className="ml-2">
            {currentChat.participants.map((p: any) => (
              p._id !== user?._id && (
                <UserStatusIndicator key={p._id} userId={p._id} userStatuses={userStatuses} />
              )
            ))}
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
          {currentChat.avatar ? (
            <UserAvatar avatar={currentChat.avatar} username={currentChat.name} className='w-10 h-10 rounded-full'/>
          ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold">
              {currentChat.name?.charAt(0) || 'U'}
            </span>
          </div>
          )}
          <div>
            <h2 onClick={() => currentChat.type !== 'group' && router.push(`/profile/${otherUserId?._id}`)} className="text-lg font-semibold text-gray-900">
              {currentChat.name || 'Unknown Chat'}
            </h2>
            <p className="text-sm text-gray-500 flex items-center">
              {renderStatus()}
            </p>
          </div>
        </div>
        
        <div className={`items-center ${little_Phone ? 'hidden' : 'flex'} space-x-2`}>
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

const UserStatusIndicator = ({ userId, userStatuses }: { userId: string; userStatuses: Map<string, UserStatus> }) => {
  const status = userStatuses.get(userId);
  return (
    <span className="ml-2">
      {status?.isOnline ? (
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          {status.username}
        </span>
      ) : (
        <span className="flex items-center">
          <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
          {status?.username}
        </span>
      )}
    </span>
  );
};