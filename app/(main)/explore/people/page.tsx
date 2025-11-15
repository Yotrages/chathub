"use client";
import React, { useEffect, useState } from 'react';
import { useGetSuggestedUsers, useFollowUser } from '@/hooks/useUser';
import { RootState } from '@/libs/redux/store';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { UserAvatar } from '@/components/constant/UserAvatar';
import { 
  UserPlus, 
  TrendingUp, 
  Sparkles, 
  Search, 
  ArrowLeft,
  Users,
  Filter,
  Loader2,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ExplorePeoplePage = () => {
  const router = useRouter();
  const { suggestedUsers, pagination } = useSelector((state: RootState) => state.auth);
  const { trigger, isPending } = useGetSuggestedUsers(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    trigger();
  }, []);

  const loadMore = () => {
    if (pagination?.hasNextPage) {
      trigger();
    }
  };

  const filteredUsers = suggestedUsers?.filter(user => 
   user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Explore People</h1>
                  <p className="text-sm text-gray-500">Discover amazing creators</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">
                <span className="font-semibold text-purple-600">{suggestedUsers?.length || 0}</span> users found
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Button */}
            <button className="sm:w-auto w-full px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Filter size={18} />
              <span className="font-medium">Filters</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">{suggestedUsers?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active</p>
                  <p className="text-lg font-bold text-gray-900">{suggestedUsers?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trending</p>
                  <p className="text-lg font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Sparkles size={18} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">New</p>
                  <p className="text-lg font-bold text-gray-900">8</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {isPending && suggestedUsers?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={48} className="text-purple-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading amazing people...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user, index) => (
              <Link 
                href={`/profile/${user?._id}`} 
                key={index}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 rounded-2xl p-6 border border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative flex flex-col items-center gap-4">
                  {/* Avatar with ring */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <UserAvatar 
                      username={user.username} 
                      avatar={user.avatar} 
                      className="w-20 h-20 relative border-4 border-white shadow-lg"
                    />
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-center space-y-2 w-full">
                    <p className="text-base font-bold text-gray-900 truncate px-2 group-hover:text-purple-700 transition-colors">
                      {user.username}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {user.followers?.length || 0} followers
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        {user.following?.length || 0} following
                      </span>
                    </div>
                  </div>

                  {/* Bio (if available) */}
                  {user.bio && (
                    <p className="text-xs text-gray-500 text-center line-clamp-2 w-full">
                      {user.bio}
                    </p>
                  )}

                  {/* Follow Button */}
                  <FollowButton 
                    userId={user._id} 
                    isFollowed={followedUsers[user._id]} 
                    onFollowSuccess={() => setFollowedUsers(prev => ({ ...prev, [user._id]: true }))}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {pagination?.hasNextPage && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={loadMore}
              disabled={isPending}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Loading more...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Load More People
                </>
              )}
            </button>
          </div>
        )}

        {/* End Message */}
        {!pagination?.hasNextPage && suggestedUsers && suggestedUsers?.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
              <Sparkles size={16} className="text-purple-500" />
              <span className="text-sm text-gray-600">You&apos;ve seen all available users</span>
            </div>
          </div>
        )}
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
      className={`w-full py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed ${
        isFollowed 
          ? 'bg-green-500 text-white' 
          : isPending
          ? 'bg-gray-400 text-white cursor-wait'
          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
      }`}
    >
      {isPending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Sending...
        </>
      ) : isFollowed ? (
        <>
          <Check size={16} />
          Request Sent
        </>
      ) : (
        <>
          <UserPlus size={16} />
          Follow
        </>
      )}
    </button>
  );
};

export default ExplorePeoplePage;