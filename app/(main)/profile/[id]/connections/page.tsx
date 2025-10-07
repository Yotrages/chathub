'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { useParams, useSearchParams } from 'next/navigation';
import { useGetFollowers, useGetFollowing, useGetPendingRequests, useAcceptFollowRequest, useRejectFollowRequest } from '@/hooks/useUser';
import { User } from '@/types';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

const ConnectionsPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'followers';
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'pending'>(tab as any || 'followers');
  const isOwnProfile = id === currentUser?._id;

  const { data: followersData, isLoading: followersLoading } = useGetFollowers(id as string);
  const { data: followingData, isLoading: followingLoading } = useGetFollowing(id as string);
  const { data: pendingRequestsData, isLoading: pendingLoading } = useGetPendingRequests(id as string, { enabled: isOwnProfile && activeTab === 'pending' });
  const { mutate: acceptRequest } = useAcceptFollowRequest();
  const { mutate: rejectRequest } = useRejectFollowRequest();

  const handleAcceptRequest = (followId: string) => {
    acceptRequest({followId});
  };

  const handleRejectRequest = (followId: string) => {
    rejectRequest({followId});
  };

  if (followersLoading || followingLoading || pendingLoading) {
    return (
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 sm:h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl min-h-screen mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex-1 min-w-[80px] py-3 sm:py-4 px-2 sm:px-6 text-xs sm:text-sm md:text-base font-medium transition-all whitespace-nowrap ${
                activeTab === 'followers' 
                  ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="hidden xs:inline">Followers</span>
              <span className="inline xs:hidden">Followers</span>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 min-w-[80px] py-3 sm:py-4 px-2 sm:px-6 text-xs sm:text-sm md:text-base font-medium transition-all whitespace-nowrap ${
                activeTab === 'following' 
                  ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="hidden xs:inline">Following</span>
              <span className="inline xs:hidden">Following</span>
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 min-w-[80px] py-3 sm:py-4 px-2 sm:px-6 text-xs sm:text-sm md:text-base font-medium transition-all whitespace-nowrap ${
                  activeTab === 'pending' 
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">Pending Requests</span>
                <span className="inline sm:hidden">Pending</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-4 md:p-6">
          {activeTab === 'followers' && (
            <UserList users={followersData?.data.followers || []} title="No followers yet" />
          )}
          {activeTab === 'following' && (
            <UserList users={followingData?.data.following || []} title="Not following anyone yet" />
          )}
          {activeTab === 'pending' && isOwnProfile && (
            <PendingRequestsList
              requests={pendingRequestsData?.data.pendingRequests || pendingRequestsData || []}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const UserList = ({ users, title }: { users: User[]; title: string }) => {
  if (!Array.isArray(users) || users.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-sm sm:text-base text-gray-500">{title}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {users.map((user) => (
        <Link 
          key={user._id} 
          href={`/profile/${user._id}`} 
          className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base sm:text-lg md:text-xl font-bold text-gray-600">
                {user.username && user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{user.username}</p>
            <p className="text-xs sm:text-sm text-gray-500 truncate">@{user.username}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

const PendingRequestsList = ({ 
  requests, 
  onAccept, 
  onReject 
}: { 
  requests: Array<{ _id: string; followerId: User }>;
  onAccept: (followId: string) => void;
  onReject: (followId: string) => void;
}) => {

  if (!Array.isArray(requests) || requests.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-sm sm:text-base text-gray-500">No pending follow requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {requests.map((request) => (
        <div key={request._id} className="flex items-center justify-between gap-2 p-2 sm:p-3 md:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100">
          <Link 
            href={`/profile/${request.followerId._id}`} 
            className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0">
              {request.followerId.avatar ? (
                <img src={request.followerId.avatar} alt={request.followerId.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base sm:text-lg md:text-xl font-bold text-gray-600">
                  {request.followerId.username && request.followerId.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{request.followerId.username}</p>
              <p className="text-xs sm:text-sm text-gray-500 truncate">@{request.followerId.username}</p>
            </div>
          </Link>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => onAccept(request._id)}
              className="p-1.5 sm:p-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full transition-colors shadow-sm hover:shadow-md"
              aria-label="Accept request"
            >
              <Check size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => onReject(request._id)}
              className="p-1.5 sm:p-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full transition-colors shadow-sm hover:shadow-md"
              aria-label="Reject request"
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectionsPage;