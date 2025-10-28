"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import {
  Home,
  MessageCircleMore,
  Search,
  Settings,
  Users,
  Video,
  X,
  FileText,
} from "lucide-react";
import Input from "../ui/Input";
import Link from "next/link";
import NotificationIcon from "@/components/notification/NotificationIcon";
import NotificationDropdown from "@/components/notification/NotificationDropDown";
import { api } from "@/libs/axios/config";
import { useNotifications } from "@/context/NotificationContext";
import { useGetPendingRequests } from "@/hooks/useUser";

interface User {
  _id: string;
  username: string;
  name: string;
  avatar?: string;
  isVerified?: boolean;
}

interface Post {
  _id: string;
  content: string;
  authorId: {
    username: string;
    avatar?: string;
  };
}

interface Reel {
  _id: string;
  title: string;
  authorId: {
    username: string;
    avatar?: string;
  };
}

interface Story {
  _id: string;
  text: string;
  authorId: {
    username: string;
    avatar?: string;
  };
}

interface AutocompleteSuggestions {
  users: User[];
  posts: Post[];
  reels: Reel[];
  stories: Story[];
  hashtags: string[];
  recent: string[];
}

const MAX_QUERY_LENGTH = 100;

const Header: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [frequentSearches, setFrequentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] =
    useState<AutocompleteSuggestions | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const inputSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { fetchNotifications } = useNotifications();
  const { chatsWithUnreadCount } = useSelector(
    (state: RootState) => state.chat
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: pendingRequestsData } = useGetPendingRequests(
    user?._id as string,
    !!user?._id
  );

  useEffect(() => {
    const fetchFrequentSearches = async () => {
      if (!user) {
        setFrequentSearches([]);
        return;
      }

      try {
        const res = await api.get("/search/tracking");
        if (res.status === 200 && res.data.success) {
          setFrequentSearches(res.data.searches.map((s: any) => s.query));
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          setFrequentSearches([]);
        } else {
          setFrequentSearches([]);
        }
      }
    };

    fetchFrequentSearches();
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchAutocompleteSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2 || query.length > MAX_QUERY_LENGTH) {
      setAutocompleteSuggestions(null);
      setIsLoadingSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);

      const [suggestionsRes, searchRes] = await Promise.all([
        api.get(`/search/suggestions?query=${encodeURIComponent(query)}`),
        api.get(`/search?query=${encodeURIComponent(query)}&type=all&limit=3`),
      ]);

      const suggestions: AutocompleteSuggestions = {
        users: [],
        posts: [],
        reels: [],
        stories: [],
        hashtags: [],
        recent: [],
      };

      if (suggestionsRes.status === 200 && suggestionsRes.data.success) {
        suggestions.users = suggestionsRes.data.suggestions.users || [];
        suggestions.hashtags = suggestionsRes.data.suggestions.hashtags || [];
        suggestions.recent = suggestionsRes.data.suggestions.recent || [];
      }

      if (searchRes.status === 200 && searchRes.data.success) {
        suggestions.posts = searchRes.data.results.posts || [];
        suggestions.reels = searchRes.data.results.reels || [];
        suggestions.stories = searchRes.data.results.stories || [];
      }

      setAutocompleteSuggestions(suggestions);
    } catch (error) {
      console.error("Failed to fetch autocomplete suggestions:", error);
      setAutocompleteSuggestions(null);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth > 768) {
      const handleClickOutside = (event: MouseEvent) => {
        if (isNavigating) return;

        if (
          inputSearchRef.current &&
          !inputSearchRef.current.contains(event.target as Node)
        ) {
          setIsFocused(false);
        }
        if (
          mobileSearchRef.current &&
          !mobileSearchRef.current.contains(event.target as Node)
        ) {
          setShowSearch(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isNavigating]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsFocused(false);
      setShowSearch(false);
      setAutocompleteSuggestions(null);

      router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFrequentSearchClick = (query: string) => {
    const cleanQuery = query.trim();
    setIsNavigating(true);
    router.push(`/search/${encodeURIComponent(cleanQuery)}`);
    setShowSearch(false);
    setIsFocused(false);
    setAutocompleteSuggestions(null);
    setSearchQuery("");
    setTimeout(() => setIsNavigating(false), 100); // Reset flag
  };

  const handleSuggestionClick = (query: string) => {
    const cleanQuery = query.trim();
    setIsNavigating(true);
    router.push(`/search/${encodeURIComponent(cleanQuery)}`);
    setShowSearch(false);
    setIsFocused(false);
    setAutocompleteSuggestions(null);
    setSearchQuery("");
    setTimeout(() => setIsNavigating(false), 100); // Reset flag
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setAutocompleteSuggestions(null);
      setIsLoadingSuggestions(false);
      return;
    }

    const matchesFrequentSearch = frequentSearches.some(
      (q) => q.toLowerCase() === value.toLowerCase()
    );

    if (matchesFrequentSearch) {
      setAutocompleteSuggestions(null);
      setIsLoadingSuggestions(false);
      return;
    }

    if (value.length > MAX_QUERY_LENGTH) {
      setAutocompleteSuggestions(null);
      setIsLoadingSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchAutocompleteSuggestions(value);
    }, 300);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e as any);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNotifications(false);
        setIsFocused(false);
      }
    };

    if (showSearch) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

//   const NetworkIcon = ({ count }: { count?: number }) => (
//   <span className="relative flex">
//     <Users size={18} className="text-gray-600" />
//     {count && count > 0 && (
//       <span className="absolute -top-[11px] -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
//         {count > 99 ? "99+" : count}
//       </span>
//     )}
//   </span>
// );

  const NavLinks = [
    {
      icon: <Home size={18} />,
      name: "Home",
      route: "/",
    },
    {
      icon: (
        <span className="relative flex">
          <Users size={18} className="text-gray-600" />
          {pendingRequestsData && pendingRequestsData?.data.length > 0 && (
            <span className="absolute -top-[11px] -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
              {pendingRequestsData?.data.length > 99
                ? "99+"
                : pendingRequestsData?.data.length}
            </span>
          )}
        </span>
      ),
      name: "Network",
      route: `/profile/${user?._id}/connections`,
    },
    {
      icon: <Video size={18} />,
      name: "Reels",
      route: "/reels",
    },
    {
      icon: (
        <span className="relative flex">
          <MessageCircleMore size={18} className="text-gray-600" />
          {chatsWithUnreadCount > 0 && (
            <span className="absolute -top-[11px] -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
              {chatsWithUnreadCount > 99 ? "99+" : chatsWithUnreadCount}
            </span>
          )}
        </span>
      ),
      name: "Messages",
      route: "/chat",
    },
  ];

  const handleNotificationNavigate = () => {
    router.push("/notification");
    setShowNotifications(false);
  };

  const shouldShowFrequentSearches =
    isFocused && !searchQuery.trim() && frequentSearches.length > 0;
  const shouldShowFilteredFrequentSearches =
    isFocused &&
    searchQuery.trim() &&
    frequentSearches.some((q) =>
      q.toLowerCase().includes(searchQuery.toLowerCase())
    );
  const shouldShowAutocomplete =
    isFocused &&
    searchQuery.trim() &&
    autocompleteSuggestions &&
    (autocompleteSuggestions.users.length > 0 ||
      autocompleteSuggestions.posts.length > 0 ||
      autocompleteSuggestions.reels.length > 0 ||
      autocompleteSuggestions.hashtags.length > 0 ||
      autocompleteSuggestions.recent.length > 0);

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 py-3 xs:py-4">
          <div className="sm:flex items-center justify-between gap-2 xs:gap-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="hover:opacity-80 transition-opacity duration-200"
              >
                <h1 className="text-xl xs:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ChatHub
                </h1>
              </Link>
              <div className="flex sm:hidden items-center gap-2">
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150 flex-shrink-0"
                  onClick={() => {
                    setShowSearch(true);
                    setIsFocused(true);
                  }}
                  aria-label="Open search"
                >
                  <Search size={18} className="text-gray-600" />
                </button>
                <Link
                  href="/settings"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
                >
                  <Settings size={18} className="text-gray-600" />
                </Link>
              </div>
            </div>

            {/* Desktop Search - Hidden on mobile */}
            <div
              ref={inputSearchRef}
              className="hidden sm:block flex-1 max-w-lg mx-4"
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative w-full">
                  <Input
                    type="search"
                    className="border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    icon={<Search size={16} className="text-gray-400" />}
                    left_content
                    placeholder="Search posts, users, reels..."
                    width="100%"
                    border_radius="12px"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchKeyPress}
                    onFocus={() => setIsFocused(true)}
                  />

                  {/* Desktop Search Dropdown */}
                  {(shouldShowFrequentSearches ||
                    shouldShowFilteredFrequentSearches ||
                    shouldShowAutocomplete) && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-96 overflow-y-auto z-[9999]">
                      <div className="p-2">
                        {/* Frequent/Recent Searches */}
                        {(shouldShowFrequentSearches ||
                          shouldShowFilteredFrequentSearches) && (
                          <>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                              Recent Searches
                            </p>
                            {frequentSearches
                              .filter((q) =>
                                searchQuery
                                  ? q
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase())
                                  : true
                              )
                              .slice(0, 5)
                              .map((q, index) => (
                                <div
                                  key={`frequent-${index}`}
                                  onClick={() => handleFrequentSearchClick(q)}
                                  className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150"
                                >
                                  <Search
                                    size={14}
                                    className="text-gray-400 mr-3 flex-shrink-0"
                                  />
                                  <span className="text-gray-700 truncate">
                                    {q}
                                  </span>
                                </div>
                              ))}
                          </>
                        )}

                        {/* Autocomplete Suggestions */}
                        {shouldShowAutocomplete && (
                          <>
                            {/* Users */}
                            {autocompleteSuggestions.users.length > 0 && (
                              <>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                                  Users
                                </p>
                                {autocompleteSuggestions.users.map((user) => (
                                  <div
                                    key={user._id}
                                    onClick={() =>
                                      handleSuggestionClick(user.username)
                                    }
                                    className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                                      {user.avatar ? (
                                        <img
                                          src={user.avatar}
                                          alt={user.username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-xs font-semibold text-white">
                                          {user.username
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-700 truncate font-medium">
                                        {user.username}
                                      </p>
                                      {user.name && (
                                        <p className="text-xs text-gray-500 truncate">
                                          {user.name}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* Posts */}
                            {autocompleteSuggestions.posts.length > 0 && (
                              <>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                                  Posts
                                </p>
                                {autocompleteSuggestions.posts.map((post) => (
                                  <div
                                    key={post._id}
                                    onClick={() =>
                                      handleSuggestionClick(
                                        post.content.substring(0, 50)
                                      )
                                    }
                                    className="flex items-start px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150"
                                  >
                                    <FileText
                                      size={16}
                                      className="text-gray-400 mr-3 flex-shrink-0 mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-700 line-clamp-2">
                                        {truncateText(post.content, 80)}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        by @{post.authorId.username}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}

                            {/* Reels */}
                            {autocompleteSuggestions.reels.length > 0 && (
                              <>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                                  Reels
                                </p>
                                {autocompleteSuggestions.reels.map((reel) => (
                                  <div
                                    key={reel._id}
                                    onClick={() =>
                                      handleSuggestionClick(reel.title)
                                    }
                                    className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150"
                                  >
                                    <Video
                                      size={16}
                                      className="text-gray-400 mr-3 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-700 truncate font-medium">
                                        {reel.title}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        by @{reel.authorId.username}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}

                            {autocompleteSuggestions.stories.length > 0 && (
                              <>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                                  Stories
                                </p>
                                {autocompleteSuggestions.stories.map(
                                  (story) => (
                                    <div
                                      key={`mobile-reel-${story._id}`}
                                      onClick={() => {
                                        handleSuggestionClick(
                                          story.text.substring(0, 50)
                                        );
                                      }}
                                      className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                    >
                                      <Video
                                        size={18}
                                        className="text-gray-400 mr-3 flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-700 truncate font-medium">
                                          {story.text}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                          by @{story.authorId.username}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                )}
                              </>
                            )}

                            {/* Hashtags */}
                            {autocompleteSuggestions.hashtags.length > 0 && (
                              <>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                                  Hashtags
                                </p>
                                {autocompleteSuggestions.hashtags.map(
                                  (hashtag, index) => (
                                    <div
                                      key={`hashtag-${index}`}
                                      onClick={() =>
                                        handleSuggestionClick(hashtag)
                                      }
                                      className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150"
                                    >
                                      <span className="text-blue-500 mr-3 font-semibold">
                                        #
                                      </span>
                                      <span className="text-gray-700 truncate">
                                        {hashtag.slice(1)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* Loading state */}
                        {isLoadingSuggestions && (
                          <div className="px-3 py-4 text-center">
                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          </div>
                        )}

                        {/* Current search option */}
                        {searchQuery && (
                          <div
                            onClick={() =>
                              handleFrequentSearchClick(searchQuery)
                            }
                            className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150 border-t border-gray-100 mt-2 pt-4"
                          >
                            <Search
                              size={14}
                              className="text-blue-500 mr-3 flex-shrink-0"
                            />
                            <span className="text-gray-700 truncate">
                              Search for &quot;{searchQuery}&quot;
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Navigation & User Section */}
            <div className="flex items-center justify-between sm:space-x-4">
              {/* Navigation Links */}
              <nav className="flex flex-1 pr-4 items-center justify-between md:gap-5 gap-1">
                {NavLinks.map((item, index) => (
                  <Link
                    href={item.route}
                    key={index}
                    className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-gray-50 transition-all duration-150 min-w-0 group"
                  >
                    <span className="text-gray-600 group-hover:text-blue-600 transition-colors duration-150">
                      {item.icon}
                    </span>
                    <p className="text-xs text-gray-500 group-hover:text-blue-600 hidden md:block truncate mt-1 transition-colors duration-150">
                      {item.name}
                    </p>
                  </Link>
                ))}

                {/* Notification Icon */}
                <div className="relative max-w-full">
                  {user && (
                    <NotificationIcon
                      onClick={() =>
                        window.innerWidth >= 632
                          ? setShowNotifications(!showNotifications)
                          : handleNotificationNavigate()
                      }
                      className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-gray-50 transition-colors duration-150 min-w-0"
                    />
                  )}
                  {user && (
                    <NotificationDropdown
                      isOpen={showNotifications}
                      onClose={() => setShowNotifications(false)}
                      onNavigate={handleNotificationNavigate}
                    />
                  )}
                </div>
              </nav>

              {/* User Profile */}
              <button
                onClick={() => router.push(`/profile/${user?._id}`)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-50 transition-all duration-150 min-w-0 group"
              >
                <div className="w-8 h-8 xs:w-9 xs:h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-transparent group-hover:ring-blue-200 transition-all duration-150">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.username}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <span className="font-medium hidden sm:block truncate max-w-20 md:max-w-28 group-hover:text-blue-600 transition-colors duration-150">
                  {user?.username}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 sm:hidden">
          <div
            ref={mobileSearchRef}
            className="bg-white m-4 mt-8 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Search</h3>
              <button
                onClick={() => setShowSearch(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <form onSubmit={handleSearchSubmit}>
                <Input
                  type="search"
                  className="w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  icon={<Search size={16} className="text-gray-400" />}
                  left_content
                  placeholder="Search posts, users, reels..."
                  width="100%"
                  border_radius="12px"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleSearchKeyPress}
                  onFocus={() => setIsFocused(true)}
                  autoFocus={true}
                />
              </form>
            </div>

            {/* Mobile Search Results */}
            {(shouldShowFrequentSearches ||
              shouldShowFilteredFrequentSearches ||
              shouldShowAutocomplete) && (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2">
                  {/* Frequent/Recent Searches */}
                  {(shouldShowFrequentSearches ||
                    shouldShowFilteredFrequentSearches) && (
                    <>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                        Recent Searches
                      </p>
                      {frequentSearches
                        .filter((q) =>
                          searchQuery
                            ? q
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            : true
                        )
                        .slice(0, 8)
                        .map((q, index) => (
                          <div
                            key={`mobile-frequent-${index}`}
                            onClick={() => {
                              handleFrequentSearchClick(q);
                            }}
                            className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          >
                            <Search
                              size={16}
                              className="text-gray-400 mr-3 flex-shrink-0"
                            />
                            <span className="text-gray-700 truncate">{q}</span>
                          </div>
                        ))}
                    </>
                  )}

                  {/* Autocomplete Suggestions */}
                  {shouldShowAutocomplete && (
                    <>
                      {/* Users */}
                      {autocompleteSuggestions.users.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                            Users
                          </p>
                          {autocompleteSuggestions.users.map((user) => (
                            <div
                              key={`mobile-${user._id}`}
                              onClick={() => {
                                handleSuggestionClick(user.username);
                              }}
                              className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-semibold text-white">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate font-medium">
                                  {user.username}
                                </p>
                                {user.name && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {user.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Posts */}
                      {autocompleteSuggestions.posts.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                            Posts
                          </p>
                          {autocompleteSuggestions.posts.map((post) => (
                            <div
                              key={`mobile-post-${post._id}`}
                              onClick={() => {
                                handleSuggestionClick(
                                  post.content.substring(0, 50)
                                );
                              }}
                              className="flex items-start px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            >
                              <FileText
                                size={18}
                                className="text-gray-400 mr-3 flex-shrink-0 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 line-clamp-2">
                                  {truncateText(post.content, 80)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  by @{post.authorId.username}
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Reels */}
                      {autocompleteSuggestions.reels.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                            Reels
                          </p>
                          {autocompleteSuggestions.reels.map((reel) => (
                            <div
                              key={`mobile-reel-${reel._id}`}
                              onClick={() => {
                                handleSuggestionClick(
                                  reel.title.substring(0, 50)
                                );
                              }}
                              className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            >
                              <Video
                                size={18}
                                className="text-gray-400 mr-3 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate font-medium">
                                  {reel.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  by @{reel.authorId.username}
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {autocompleteSuggestions.stories.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                            Stories
                          </p>
                          {autocompleteSuggestions.stories.map((story) => (
                            <div
                              key={`mobile-reel-${story._id}`}
                              onClick={() => {
                                handleSuggestionClick(
                                  story.text.substring(0, 50)
                                );
                              }}
                              className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            >
                              <Video
                                size={18}
                                className="text-gray-400 mr-3 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate font-medium">
                                  {story.text}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  by @{story.authorId.username}
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Hashtags */}
                      {autocompleteSuggestions.hashtags.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2 mt-3">
                            Hashtags
                          </p>
                          {autocompleteSuggestions.hashtags.map(
                            (hashtag, index) => (
                              <div
                                key={`mobile-hashtag-${index}`}
                                onClick={() => {
                                  handleSuggestionClick(hashtag);
                                }}
                                className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                              >
                                <span className="text-blue-500 mr-3 font-semibold text-lg">
                                  #
                                </span>
                                <span className="text-gray-700 truncate">
                                  {hashtag.slice(1)}
                                </span>
                              </div>
                            )
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Loading state */}
                  {isLoadingSuggestions && (
                    <div className="px-3 py-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  )}

                  {/* Current search option */}
                  {searchQuery && (
                    <div
                      onClick={() => {
                        handleFrequentSearchClick(searchQuery);
                      }}
                      className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150 border-t border-gray-100 mt-2 pt-4"
                    >
                      <Search
                        size={14}
                        className="text-blue-500 mr-3 flex-shrink-0"
                      />
                      <span className="text-gray-700 truncate">
                        Search for &apos;{searchQuery}&apos;
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!shouldShowFrequentSearches &&
              !shouldShowFilteredFrequentSearches &&
              !shouldShowAutocomplete &&
              !isLoadingSuggestions && (
                <div className="p-8 text-center">
                  <Search size={32} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Start typing to search</p>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
