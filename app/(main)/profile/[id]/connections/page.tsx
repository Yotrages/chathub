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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'followers' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'following' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Following
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === 'pending' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Pending Requests
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
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
      <div className="text-center py-12">
        <p className="text-gray-500">{title}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Link key={user._id} href={`/profile/${user._id}`} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
                {user.username && user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.username}</p>
            <p className="text-sm text-gray-500">@{user.username}</p>
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
      <div className="text-center py-12">
        <p className="text-gray-500">No pending follow requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <Link href={`/profile/${request.followerId._id}`} className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
              {request.followerId.avatar ? (
                <img src={request.followerId.avatar} alt={request.followerId.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
                  {request.followerId.username && request.followerId.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{request.followerId.username}</p>
              <p className="text-sm text-gray-500">@{request.followerId.username}</p>
            </div>
          </Link>
          <div className="flex space-x-2">
            <button
              onClick={() => onAccept(request._id)}
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => onReject(request._id)}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectionsPage;