import { useGetSuggestedUsers, useFollowUser } from '@/hooks/useUser';
import { RootState } from '@/libs/redux/store';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { UserAvatar } from '../constant/UserAvatar';
import { UserPlus, TrendingUp, Sparkles, Check } from 'lucide-react';

const SuggestedFollow = () => {
  const { suggestedUsers, pagination } = useSelector((state: RootState) => state.auth);
  const { trigger } = useGetSuggestedUsers(pagination?.currentPage || 1);
  const hasMore = pagination?.hasNextPage ?? false;
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    trigger();
  }, []);

  if (!suggestedUsers || suggestedUsers.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Discover People</h2>
              <p className="text-xs text-gray-500">Connect with amazing creators</p>
            </div>
          </div>
          <TrendingUp size={18} className="text-purple-500" />
        </div>

        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory">
            {suggestedUsers.map((user, index) => (
              <Link 
                href={`/profile/${user?._id}`} 
                key={index}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 rounded-xl p-4 border border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg flex-shrink-0 w-40 snap-start"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <UserAvatar 
                      username={user.username} 
                      avatar={user.avatar} 
                      className="w-16 h-16 relative border-2 border-white shadow-md"
                    />
                    
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-center space-y-1 w-full">
                    <p className="text-sm font-bold text-gray-900 truncate px-2 group-hover:text-purple-700 transition-colors">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.followers?.length || 0} followers
                    </p>
                  </div>

                  {/* Follow Button */}
                  <FollowButton 
                    userId={user._id} 
                    isFollowed={followedUsers[user._id]} 
                    onFollowSuccess={() => setFollowedUsers(prev => ({ ...prev, [user._id]: true }))}
                  />
                </div>
              </Link>
            ))}

            {/* Load More Card */}
            {hasMore && (
              <button 
                onClick={() => trigger()}
                className="group relative bg-gradient-to-br from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-xl p-4 border-2 border-dashed border-purple-300 hover:border-purple-400 transition-all duration-300 hover:shadow-lg flex-shrink-0 w-40 snap-start"
              >
                <div className="flex flex-col items-center justify-center gap-3 h-full min-h-[200px]">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus size={24} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-purple-700">View More</p>
                    <p className="text-xs text-purple-600">Discover others</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            {suggestedUsers.length} active users
          </span>
          <Link href="/explore/people" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
            Explore all →
          </Link>
        </div>
      </div>
    </div>
  );
};

const FollowButton: React.FC<{ 
  userId: string; 
  isFollowed?: boolean;
  onFollowSuccess: () => void;
}> = ({ userId, isFollowed, onFollowSuccess }) => {
  const { mutate: followUser, isPending } = useFollowUser(userId, () => {
    onFollowSuccess();
  });

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isFollowed && !isPending) {
      followUser();
    }
  };

  return (
    <button 
      onClick={handleFollow}
      disabled={isPending || isFollowed}
      className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg disabled:cursor-not-allowed ${
        isFollowed 
          ? 'bg-green-500 text-white' 
          : isPending
          ? 'bg-gray-400 text-white cursor-wait'
          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
      }`}
    >
      {isPending ? (
        <>
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Sending...
        </>
      ) : isFollowed ? (
        <>
          <Check size={14} />
          Request Sent
        </>
      ) : (
        <>
          <UserPlus size={14} />
          Follow
        </>
      )}
    </button>
  );
};

export default SuggestedFollow;