"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Post, Reel, Story, User } from "@/types";
import { PostItem } from "@/components/post/PostItem";
import { api } from "@/libs/axios/config";
import ReelCard from "@/components/reels/ReelCard";
import StoryCard from "@/components/story/StoryCard";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/libs/redux/store";
import { addViewToStory } from "@/libs/redux/storySlice";
import { Search, Users, FileText, Video, Clock, TrendingUp, Filter, Grid, List } from "lucide-react";

interface SearchResult {
  posts: Post[];
  reels: Reel[];
  users: Array<User>;
  stories: Story[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SearchResponse {
    error?: string;
  success: boolean;
  results: SearchResult;
  total: number;
  pagination: {
    posts: PaginationInfo;
    reels: PaginationInfo;
    users: PaginationInfo;
    stories: PaginationInfo;
  };
}

const SearchPage: React.FC = () => {
  const params = useParams();
  const { query } = params;
  const router = useRouter();
  const dispatch: AppDispatch = useDispatch();
  
  const [searchResults, setSearchResults] = useState<SearchResult>({
    posts: [],
    reels: [],
    users: [],
    stories: []
  });
  const [pagination, setPagination] = useState<SearchResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'reels' | 'stories'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'relevant'>('relevant');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const tabs = [
    { 
      id: 'all' as const, 
      label: 'All', 
      icon: Search, 
      count: searchResults.posts.length + searchResults.reels.length + searchResults.users.length + searchResults.stories.length 
    },
    { id: 'users' as const, label: 'People', icon: Users, count: searchResults.users.length },
    { id: 'posts' as const, label: 'Posts', icon: FileText, count: searchResults.posts.length },
    { id: 'reels' as const, label: 'Reels', icon: Video, count: searchResults.reels.length },
    { id: 'stories' as const, label: 'Stories', icon: Clock, count: searchResults.stories.length },
  ];

  const fetchSearchResults = async (page: number = 1, append: boolean = false) => {
    if (!query || typeof query !== "string") return;
    
    try {
      if (!append) setLoading(true);
      else setIsLoadingMore(true);

      const response = await api.get(`/search`, {
        params: {
          query: encodeURIComponent(query),
          page,
          limit: 20,
          type: activeTab === 'all' ? undefined : activeTab,
          sortBy
        }
      });

      const data: SearchResponse = response.data;
      
      if (data.success) {
        if (append) {
          setSearchResults(prev => ({
            posts: [...prev.posts, ...data.results.posts],
            reels: [...prev.reels, ...data.results.reels],
            users: [...prev.users, ...data.results.users],
            stories: [...prev.stories, ...data.results.stories]
          }));
        } else {
          setSearchResults(data.results);
        }
        setPagination(data.pagination);
      } else {
        setError(data?.error || "Failed to fetch search results");
      }
    } catch (err) {
      console.log(err)
      setError("Failed to fetch search results");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (query && typeof query === "string") {
      setSearchResults({ posts: [], reels: [], users: [], stories: [] });
      setPagination(null);
      fetchSearchResults(1, false);
    }
  }, [query, activeTab, sortBy]);

  const handleReelClick = (reelId: string) => {
    dispatch(addViewToStory(reelId));
    router.push(`/stories/${reelId}`);
  };

  const loadMore = () => {
    if (!pagination) return;
    
    const currentPagination = activeTab === 'all' 
      ? pagination.posts 
      : pagination[activeTab as keyof typeof pagination];
      
    if (currentPagination?.hasNextPage) {
      fetchSearchResults(currentPagination.page + 1, true);
    }
  };

  const renderUsers = () => (
    <div className={`grid gap-4 ${viewMode === 'grid' 
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
      : 'grid-cols-1'
    }`}>
      {searchResults.users.map((user) => (
        <Link
          key={user._id}
          href={`/profile/${user._id}`}
          className="group flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200"
        >
          <div className="relative">
            <Image
              src={user.avatar || "/default-avatar.png"}
              alt={user?.username || ""}
              width={56}
              height={56}
              className="rounded-full ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all"
            />
            {user.online && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-gray-900 truncate">{user.username}</p>
              {user.isVerified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            {user.bio && (
              <p className="text-sm text-gray-600 truncate mt-1">{user.bio}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>{user.postsCount || 0} posts</span>
              <span>{user.followersCount || 0} followers</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const renderPosts = () => (
    <div className="space-y-6">
      {searchResults.posts.map((post, index) => (
        <PostItem key={`${post._id}-${index}`} post={post} />
      ))}
    </div>
  );

  const renderReels = () => (
    <div className={`grid gap-4 ${viewMode === 'grid' 
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' 
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }`}>
      {searchResults.reels.map((reel) => (
        <div key={reel._id} className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
          <ReelCard reel={reel} isCompact={true} />
        </div>
      ))}
    </div>
  );

  const renderStories = () => (
    <div className={`grid gap-4 ${viewMode === 'grid' 
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' 
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }`}>
      {searchResults.stories.map((story) => (
        <div
          key={story._id}
          onClick={() => handleReelClick(story._id)}
          className="cursor-pointer aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden transform hover:scale-105 transition-transform"
        >
          <StoryCard story={story} isCompact={true} />
        </div>
      ))}
    </div>
  );

  const renderAllResults = () => (
    <div className="space-y-8">
      {searchResults.users.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">People</h3>
            <Link 
              href="#" 
              onClick={() => setActiveTab('users')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.users.slice(0, 6).map((user) => (
              <Link
                key={user._id}
                href={`/profile/${user._id}`}
                className="group flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
              >
                <Image
                  src={user.avatar || "/default-avatar.png"}
                  alt={user?.username || ""}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="ml-3 flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.username}</p>
                  <p className="text-sm text-gray-600 truncate">{user.bio}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {searchResults.posts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Posts</h3>
            <Link 
              href="#" 
              onClick={() => setActiveTab('posts')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {searchResults.posts.slice(0, 3).map((post, index) => (
              <PostItem key={`${post._id}-${index}`} post={post} />
            ))}
          </div>
        </div>
      )}

      {searchResults.reels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Reels</h3>
            <Link 
              href="#" 
              onClick={() => setActiveTab('reels')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {searchResults.reels.slice(0, 6).map((reel) => (
              <div key={reel._id} className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                <ReelCard reel={reel} isCompact={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults.stories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Stories</h3>
            <Link 
              href="#" 
              onClick={() => setActiveTab('stories')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {searchResults.stories.slice(0, 6).map((story) => (
              <div
                key={story._id}
                onClick={() => handleReelClick(story._id)}
                className="cursor-pointer aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden"
              >
                <StoryCard story={story} isCompact={true} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const hasResults = searchResults.posts.length > 0 || 
                   searchResults.reels.length > 0 || 
                   searchResults.users.length > 0 || 
                   searchResults.stories.length > 0;

  const getCurrentPagination = () => {
    if (!pagination) return null;
    return activeTab === 'all' ? pagination.posts : pagination[activeTab as keyof typeof pagination];
  };

  const currentPagination = getCurrentPagination();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Search Results
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Showing results for <span className="font-semibold text-blue-600">&apos;{query}&apos;</span>
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activeTab === tab.id 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            {hasResults && activeTab !== 'all' && (
              <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-600" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="relevant">Most Relevant</option>
                      <option value="recent">Most Recent</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                </div>
                
                {(activeTab === 'reels' || activeTab === 'stories') && (
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'grid' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'list' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {hasResults ? (
              <div className="space-y-8">
                {activeTab === 'all' && renderAllResults()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'posts' && renderPosts()}
                {activeTab === 'reels' && renderReels()}
                {activeTab === 'stories' && renderStories()}

                {/* Load More Button */}
                {currentPagination?.hasNextPage && (
                  <div className="flex justify-center pt-8">
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4" />
                          <span>Load More</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or explore different categories
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;