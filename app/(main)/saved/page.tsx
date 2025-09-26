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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Elegant Header Section */}
        <div className="bg-white rounded-3xl shadow-xl mb-8 overflow-hidden backdrop-blur-sm bg-white/95">
          {/* Gradient Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-12 sm:px-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <Bookmark className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Saved Posts</h1>
                  <p className="text-blue-100 text-lg">
                    Your personal collection of memorable posts
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-white/80 text-sm uppercase tracking-wide mb-1">Total Saved</div>
                <div className="text-3xl font-bold text-white">{savedPosts?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="bg-white border-b border-gray-100">
            <nav className="flex" aria-label="Saved Posts Tabs">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex-1 inline-flex items-center justify-center py-6 px-4 font-medium text-sm transition-all duration-300 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`mr-3 w-5 h-5 transition-transform duration-300 ${
                      isActive ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{tab.label}</span>
                      <span className={`text-xs ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                        {tab.count} posts
                      </span>
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full"></div>
                    )}
                    {index < tabs.length - 1 && (
                      <div className="absolute right-0 top-4 bottom-4 w-px bg-gray-200"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description & Sort Info */}
          <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-gray-700 font-medium">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {activeTab === 'latest' && (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    <span>Newest first</span>
                  </>
                )}
                {activeTab === 'oldest' && (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    <span>Oldest first</span>
                  </>
                )}
                {activeTab === 'all' && (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>All posts</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section with Enhanced Styling */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/20">
          <div className="p-6 sm:p-8">
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
    <div className="space-y-8">
      {/* Sort Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              {sortType === 'latest' && <Clock className="w-5 h-5 text-blue-600" />}
              {sortType === 'oldest' && <Calendar className="w-5 h-5 text-blue-600" />}
              {sortType === 'all' && <Bookmark className="w-5 h-5 text-blue-600" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {sortType === 'latest' && 'Latest Saved Posts'}
                {sortType === 'oldest' && 'Oldest Saved Posts'}
                {sortType === 'all' && 'All Saved Posts'}
              </h3>
              <p className="text-sm text-gray-600">
                {savedPosts.length} {savedPosts.length === 1 ? 'post' : 'posts'} in your collection
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{savedPosts.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Saved Posts</div>
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
    <div className="space-y-6">
      {/* Sort indicator badge */}
      <div className="sticky top-4 z-10 flex justify-center mb-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {sortType === 'latest' && (
              <>
                <ArrowDown className="w-4 h-4 text-blue-500" />
                <span>Showing newest saved posts first</span>
              </>
            )}
            {sortType === 'oldest' && (
              <>
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span>Showing oldest saved posts first</span>
              </>
            )}
            {sortType === 'all' && (
              <>
                <Bookmark className="w-4 h-4 text-purple-500" />
                <span>Showing all saved posts</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <UserPostsList userId={userId} type="saved" />
      </div>
    </div>
  );
};

const SavedPostsSkeleton = () => (
  <div className="space-y-8">
    {/* Header skeleton */}
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-300 p-2 rounded-lg w-9 h-9"></div>
          <div>
            <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="h-8 bg-gray-300 rounded w-8 mb-1"></div>
          <div className="h-3 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    </div>

    {/* Posts skeleton */}
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
          {/* Save date indicator skeleton */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-8"></div>
          </div>
          
          {/* Post skeleton */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-4 bg-gray-200 rounded w-3/5"></div>
            </div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
            <div className="flex items-center justify-between pt-3">
              <div className="flex space-x-6">
                <div className="h-8 bg-gray-200 rounded-full w-16"></div>
                <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                <div className="h-8 bg-gray-200 rounded-full w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const EmptySavedPosts = () => (
  <div className="text-center py-20">
    <div className="relative mb-8">
      <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
        <Bookmark className="w-16 h-16 text-gray-400" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
        <Star className="w-4 h-4 text-yellow-500" />
      </div>
    </div>
    
    <div className="max-w-md mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">No saved posts yet</h3>
      <p className="text-gray-600 mb-8 leading-relaxed">
        Your saved posts will appear here. When you find interesting posts, 
        tap the bookmark icon to save them for later reading.
      </p>
    </div>

    {/* Tips section */}
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 max-w-lg mx-auto border border-blue-100">
      <div className="flex items-start space-x-4">
        <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
          <Star className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-left">
          <h4 className="font-semibold text-gray-900 mb-2">Pro Tips</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Bookmark posts to read them later</li>
            <li>• Organize your saved content by date</li>
            <li>• Never lose track of interesting posts</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Call to action */}
    <div className="mt-12">
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
        <Bookmark className="w-4 h-4" />
        <span>Start exploring posts to save</span>
      </div>
    </div>
  </div>
);

export default SavedPage;