'use client'
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { UserPosts as UserPostsList } from '@/components/profile/UserProfile';
import { Bookmark, Clock, Calendar, Star, ArrowDown, ArrowUp } from 'lucide-react';

const SavedPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { savedPosts } = useSelector((state: RootState) => state.post);
  const [activeTab, setActiveTab] = useState('latest');

  const tabs = [
    {
      id: 'latest',
      label: 'Latest',
      icon: Clock,
      description: 'Recently saved posts',
      count: savedPosts?.length || 0
    },
    {
      id: 'oldest',
      label: 'Oldest',
      icon: Calendar,
      description: 'First saved posts',
      count: savedPosts?.length || 0
    },
    {
      id: 'all',
      label: 'All Saved',
      icon: Bookmark,
      description: 'All your saved posts',
      count: savedPosts?.length || 0
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-2 sm:py-4 px-2 sm:px-4 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Elegant Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl mb-4 sm:mb-8 overflow-hidden backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 transition-colors duration-200">
          {/* Gradient Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-3 py-6 sm:px-6 sm:py-12">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-4 rounded-xl sm:rounded-2xl flex-shrink-0">
                    <Bookmark className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 truncate">Saved Posts</h1>
                    <p className="text-blue-100 text-xs sm:text-base lg:text-lg leading-tight">
                      Your collection
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-white/80 text-xs uppercase tracking-wide mb-1">Total</div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{savedPosts?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <nav className="flex" aria-label="Saved Posts Tabs">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex-1 inline-flex items-center justify-center py-3 sm:py-6 px-1 sm:px-4 font-medium text-xs sm:text-sm transition-all duration-300 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`mr-1 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 flex-shrink-0 ${
                      isActive ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <div className="flex flex-col items-start min-w-0">
                      <span className="font-semibold truncate w-full text-left">{tab.label}</span>
                      <span className={`text-xs hidden sm:inline ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                        {tab.count} posts
                      </span>
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full"></div>
                    )}
                    {index < tabs.length - 1 && (
                      <div className="absolute right-0 top-2 sm:top-4 bottom-2 sm:bottom-4 w-px bg-gray-200"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description & Sort Info */}
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700/50 dark:to-blue-900/20 transition-colors duration-200">
            <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                <p className="text-gray-700 font-medium text-xs sm:text-base truncate">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 flex-shrink-0">
                {activeTab === 'latest' && (
                  <>
                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Newest first</span>
                    <span className="sm:hidden">Newest</span>
                  </>
                )}
                {activeTab === 'oldest' && (
                  <>
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Oldest first</span>
                    <span className="sm:hidden">Oldest</span>
                  </>
                )}
                {activeTab === 'all' && (
                  <>
                    <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">All posts</span>
                    <span className="sm:hidden">All</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section with Enhanced Styling */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/30 transition-colors duration-200">
          <div className="p-3 sm:p-6 lg:p-8">
            <SavedPostsWrapper userId={user?._id as string} sortType={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SavedPostsWrapper = ({ userId, sortType }: { userId: string; sortType: string }) => {
  const { savedPosts, isLoading } = useSelector((state: RootState) => state.post);

  if (isLoading && (!savedPosts || savedPosts.length === 0)) {
    return <SavedPostsSkeleton />;
  }

  if (!savedPosts || savedPosts.length === 0) {
    return <EmptySavedPosts />;
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Sort Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-blue-100">
        <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              {sortType === 'latest' && <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
              {sortType === 'oldest' && <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
              {sortType === 'all' && <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {sortType === 'latest' && 'Latest Saved'}
                {sortType === 'oldest' && 'Oldest Saved'}
                {sortType === 'all' && 'All Saved'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {savedPosts.length} {savedPosts.length === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{savedPosts.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Posts</div>
          </div>
        </div>
      </div>

      {/* Enhanced Posts Display */}
      <div className="relative">
        <EnhancedUserPostsList userId={userId} sortType={sortType} />
      </div>
    </div>
  );
};

const EnhancedUserPostsList = ({ userId, sortType }: { userId: string; sortType: string }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sort indicator badge */}
      <div className="sticky top-2 sm:top-4 z-10 flex justify-center mb-3 sm:mb-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 sm:px-6 py-1.5 sm:py-2 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
            {sortType === 'latest' && (
              <>
                <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                <span className="truncate">Newest first</span>
              </>
            )}
            {sortType === 'oldest' && (
              <>
                <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                <span className="truncate">Oldest first</span>
              </>
            )}
            {sortType === 'all' && (
              <>
                <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                <span className="truncate">All saved</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <UserPostsList userId={userId} type="saved" />
      </div>
    </div>
  );
};

const SavedPostsSkeleton = () => (
  <div className="space-y-4 sm:space-y-8">
    {/* Header skeleton */}
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-gray-300 p-1.5 sm:p-2 rounded-lg w-7 h-7 sm:w-9 sm:h-9"></div>
          <div>
            <div className="h-4 sm:h-5 bg-gray-300 rounded w-20 sm:w-32 mb-1 sm:mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-300 rounded w-16 sm:w-24"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="h-6 sm:h-8 bg-gray-300 rounded w-6 sm:w-8 mb-1"></div>
          <div className="h-2 sm:h-3 bg-gray-300 rounded w-12 sm:w-16"></div>
        </div>
      </div>
    </div>

    {/* Posts skeleton */}
    <div className="space-y-3 sm:space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 animate-pulse">
          {/* Save date indicator skeleton */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-200 rounded"></div>
              <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-24"></div>
            </div>
            <div className="h-2 sm:h-3 bg-gray-200 rounded w-6 sm:w-8"></div>
          </div>
          
          {/* Post skeleton */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3 mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/5"></div>
            </div>
            <div className="h-32 sm:h-48 bg-gray-200 rounded-xl"></div>
            <div className="flex items-center justify-between pt-2 sm:pt-3">
              <div className="flex space-x-3 sm:space-x-6">
                <div className="h-6 sm:h-8 bg-gray-200 rounded-full w-12 sm:w-16"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded-full w-14 sm:w-20"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded-full w-12 sm:w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EmptySavedPosts = () => (
  <div className="text-center py-10 sm:py-20 px-3">
    <div className="relative mb-6 sm:mb-8">
      <div className="mx-auto w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
        <Bookmark className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400" />
      </div>
      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center">
        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
      </div>
    </div>
    
    <div className="max-w-md mx-auto">
      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">No saved posts yet</h3>
      <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
        Your saved posts will appear here. When you find interesting posts, 
        tap the bookmark icon to save them for later reading.
      </p>
    </div>

    {/* Tips section */}
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-8 max-w-lg mx-auto border border-blue-100">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        <div className="text-left min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Pro Tips</h4>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
            <li>• Bookmark posts to read later</li>
            <li>• Organize by date</li>
            <li>• Never lose interesting posts</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Call to action */}
    <div className="mt-8 sm:mt-12">
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
        <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="truncate">Start exploring</span>
      </div>
    </div>
  </div>
);

export default SavedPage;