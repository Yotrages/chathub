"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Post, Reel, Story, User } from "@/types";
import { PostItem } from "@/components/post/PostItem";
import { api } from "@/libs/axios/config";
import ReelCard from "@/components/reels/ReelCard";
import StoryCard from "@/components/story/StoryCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/libs/redux/store";
import { addViewToStory } from "@/libs/redux/storySlice";
import {
  Search,
  Users,
  FileText,
  Video,
  Clock,
  TrendingUp,
  Filter,
  Grid,
  List,
  Trash2,
  X,
} from "lucide-react";
import { UserAvatar } from "@/components/constant/UserAvatar";

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

interface FrequentSearch {
  _id: string;
  query: string;
  count: number;
  lastSearched: string;
}

const cleanSearchQuery = (rawQuery: string | string[] | undefined): string => {
  if (!rawQuery) return '';
  
  const queryString = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  
  if (!queryString) return '';
  
  try {
    let decoded = decodeURIComponent(queryString);
    
    decoded = decoded
      .replace(/\$/g, '')           
      .replace(/%20/g, ' ')         
      .replace(/%24/g, '')          
      .replace(/\+/g, ' ')          
      .replace(/[^\w\s#@.-]/gi, '') 
      .trim();                      
    
    return decoded;
  } catch (error) {
    console.error('Error decoding query:', error);
    return queryString;
  }
};

const SearchPage: React.FC = () => {
  const params = useParams();
  const rawQuery = params?.query; 
  const router = useRouter();
  const dispatch: AppDispatch = useDispatch();

  const query = cleanSearchQuery(rawQuery);

  const [searchResults, setSearchResults] = useState<SearchResult>({
    posts: [],
    reels: [],
    users: [],
    stories: [],
  });
  const [pagination, setPagination] = useState<
    SearchResponse["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "users" | "posts" | "reels" | "stories"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "relevant">(
    "relevant"
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [frequentSearches, setFrequentSearches] = useState<FrequentSearch[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const tabs = [
    {
      id: "all" as const,
      label: "All",
      icon: Search,
      count:
        searchResults.posts.length +
        searchResults.reels.length +
        searchResults.users.length +
        searchResults.stories.length,
    },
    {
      id: "users" as const,
      label: "People",
      icon: Users,
      count: searchResults.users.length,
    },
    {
      id: "posts" as const,
      label: "Posts",
      icon: FileText,
      count: searchResults.posts.length,
    },
    {
      id: "reels" as const,
      label: "Reels",
      icon: Video,
      count: searchResults.reels.length,
    },
    {
      id: "stories" as const,
      label: "Stories",
      icon: Clock,
      count: searchResults.stories.length,
    },
  ];

  const fetchFrequentSearches = async () => {
    if (!user) return;
    
    try {
      setLoadingHistory(true);
      const response = await api.get("/search/tracking", {
        params: { limit: 10 },
      });
      
      if (response.data.success) {
        setFrequentSearches(response.data.searches);
      }
    } catch (err) {
      console.error("Error fetching search history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const clearAllSearchHistory = async () => {
    if (!user) return;
    
    try {
      const response = await api.delete("/search/history");
      
      if (response.data.success) {
        setFrequentSearches([]);
        alert(`Cleared ${response.data.deletedCount} search entries`);
      }
    } catch (err) {
      console.error("Error clearing search history:", err);
      alert("Failed to clear search history");
    }
  };

  const deleteSearchEntry = async (searchId: string) => {
    if (!user) return;
    
    try {
      const response = await api.delete(`/search/history/${searchId}`);
      
      if (response.data.success) {
        setFrequentSearches(prev => prev.filter(s => s._id !== searchId));
      }
    } catch (err) {
      console.error("Error deleting search entry:", err);
      alert("Failed to delete search entry");
    }
  };

  const fetchSearchResults = async (
    page: number = 1,
    append: boolean = false
  ) => {
    if (!query || query.trim().length === 0) return;

    try {
      if (!append) setLoading(true);
      else setIsLoadingMore(true);

      const response = await api.get(`/search`, {
        params: {
          query: query.trim(), 
          page,
          limit: 20,
          type: activeTab === "all" ? undefined : activeTab,
          sortBy,
        },
      });

      const data: SearchResponse = response.data;

      if (data.success) {
        if (append) {
          setSearchResults((prev) => ({
            posts: [...prev.posts, ...data.results.posts],
            reels: [...prev.reels, ...data.results.reels],
            users: [...prev.users, ...data.results.users],
            stories: [...prev.stories, ...data.results.stories],
          }));
        } else {
          setSearchResults(data.results);
        }
        setPagination(data.pagination);
      } else {
        setError(data?.error || "Failed to fetch search results");
      }
    } catch (err) {
      console.log(err);
      setError("Failed to fetch search results");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (query && query.trim().length > 0) {
      setSearchResults({ posts: [], reels: [], users: [], stories: [] });
      setPagination(null);
      fetchSearchResults(1, false);
    }
  }, [query, activeTab, sortBy]);

  useEffect(() => {
    if (user && showHistory) {
      fetchFrequentSearches();
    }
  }, [user, showHistory]);

  const handleReelClick = (reelId: string) => {
    dispatch(addViewToStory(reelId));
    router.push(`/stories/${reelId}`);
  };

  const loadMore = () => {
    if (!pagination) return;

    const currentPagination =
      activeTab === "all"
        ? pagination.posts
        : pagination[activeTab as keyof typeof pagination];

    if (currentPagination?.hasNextPage) {
      fetchSearchResults(currentPagination.page + 1, true);
    }
  };

  const renderUsers = () => (
    <div
      className={`grid gap-4 ${
        viewMode === "grid"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      }`}
    >
      {searchResults.users.map((user) => (
        <Link
          key={user._id}
          href={`/profile/${user._id}`}
          className="group flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200"
        >
          <div className="relative">
            <UserAvatar avatar={user.avatar} username={user.username} className="w-14 h-14"/>
            {user.online && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-gray-900 truncate">
                {user.username}
              </p>
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
    <div
      className={`grid gap-4 ${
        viewMode === "grid"
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      }`}
    >
      {searchResults.reels.map((reel) => (
        <div
          key={reel._id}
          className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden"
        >
          <ReelCard reel={reel} isCompact={true} />
        </div>
      ))}
    </div>
  );

  const renderStories = () => (
    <div
      className={`grid gap-4 ${
        viewMode === "grid"
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      }`}
    >
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
    <div className="mt-8 mb-3">
      {searchResults.users.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">People</h3>
            <Link
              href="#"
              onClick={() => setActiveTab("users")}
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
                <img
                  src={user.avatar || "/default-avatar.png"}
                  alt={user?.username || ""}
                  className="rounded-full w-10 h-10"
                />
                <div className="ml-3 flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{user.bio}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {searchResults.posts.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Posts</h3>
            <Link
              href="#"
              onClick={() => setActiveTab("posts")}
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
        <div className="mb-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Reels</h3>
            <Link
              href="#"
              onClick={() => setActiveTab("reels")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {searchResults.reels.slice(0, 6).map((reel) => (
              <div
                key={reel._id}
                className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden"
              >
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
              onClick={() => setActiveTab("stories")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
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

  const hasResults =
    searchResults.posts.length > 0 ||
    searchResults.reels.length > 0 ||
    searchResults.users.length > 0 ||
    searchResults.stories.length > 0;

  const getCurrentPagination = () => {
    if (!pagination) return null;
    return activeTab === "all"
      ? pagination.posts
      : pagination[activeTab as keyof typeof pagination];
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
            <h1 className="text-3xl font-bold text-gray-900">Search Results</h1>
            {user && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search History"
              >
                <Clock className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>
          <p className="text-lg text-gray-600">
            Showing results for{" "}
            <span className="font-semibold text-blue-600">
              &apos;{query}&apos;
            </span>
          </p>
        </div>

        {showHistory && user && (
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Search History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : frequentSearches.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                      {frequentSearches.length} searches
                    </span>
                    <button
                      onClick={clearAllSearchHistory}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {frequentSearches.map((search) => (
                      <div
                        key={search._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <Link
                          href={`/search/${encodeURIComponent(search.query)}`}
                          className="flex-1 min-w-0"
                          onClick={() => setShowHistory(false)}
                        >
                          <p className="font-medium text-gray-900 truncate">
                            {search.query}
                          </p>
                          <p className="text-xs text-gray-500">
                            {search.count} searches
                          </p>
                        </Link>
                        <button
                          onClick={() => deleteSearchEntry(search._id)}
                          className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No search history yet</p>
                </div>
              )}
            </div>
          </div>
        )}

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
              <div className="flex overflow-x-auto snap-start snap-x snap-mandatory scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600 bg-blue-50"
                          : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            activeTab === tab.id
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            {hasResults && activeTab !== "all" && (
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

                {(activeTab === "reels" || activeTab === "stories") && (
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === "grid"
                          ? "bg-white shadow-sm text-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === "list"
                          ? "bg-white shadow-sm text-blue-600"
                          : "text-gray-600 hover:text-gray-900"
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
                {activeTab === "all" && renderAllResults()}
                {activeTab === "users" && renderUsers()}
                {activeTab === "posts" && renderPosts()}
                {activeTab === "reels" && renderReels()}
                {activeTab === "stories" && renderStories()}

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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or explore different
                    categories
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