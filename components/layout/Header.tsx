"use client";
import React, { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import Input from "../ui/Input";
import Link from "next/link";
import NotificationIcon from "@/components/notification/NotificationIcon";
import NotificationDropdown from "@/components/notification/NotificationDropDown";
import { api } from "@/libs/axios/config";

const Header: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [frequentSearches, setFrequentSearches] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const inputSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchFrequentSearches = async () => {
      try {
        const res = await api.get("/search/tracking");
        if (res.status === 200) {
          const data = res.data;
          setFrequentSearches(data.searches.map((s: any) => s.query));
        }
      } catch (error) {
        console.error("Failed to fetch frequent searches:", error);
        // Fallback to empty array or default searches
        setFrequentSearches([]);
      }
    };
    fetchFrequentSearches();
  }, []);

  // Handle search submit - FIXED
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Clear focus and close modals
      setIsFocused(false);
      setShowSearch(false);
      
      // Navigate to search results
      router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Track search for frequent searches - NEW
  const trackSearch = async (query: string) => {
    try {
      await api.post("/search/tracking", { query });
    } catch (error) {
      console.error("Failed to track search:", error);
    }
  };

  // Handle frequent search click - FIXED
  const handleFrequentSearchClick = (query: string) => {
    setSearchQuery(query);
    setIsFocused(false);
    setShowSearch(false);
    
    // Navigate to search results
    router.push(`/search/${encodeURIComponent(query)}`);
    
    // Track the search
    trackSearch(query);
  };

  // Handle search input change - ENHANCED
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search input key press - NEW
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any);
    }
  };

  // Handle search modal close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
        setIsFocused(false);
      }
    };

    if (showSearch) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showSearch]);

  const NavLinks = [
    {
      icon: <Home size={18} />,
      name: "Home",
      route: "/",
    },
    {
      icon: <Users size={18} />,
      name: "Network",
      route: `/profile/${user?._id}/connections`
    },
    {
      icon: <Video size={18}/>,
      name: 'Reels',
      route: '/reels'
    },
    {
      icon: <MessageCircleMore size={18} />,
      name: "Messages",
      route: "/chat",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputSearchRef.current && !inputSearchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationNavigate = () => {
    router.push('/notification');
    setShowNotifications(false);
  };

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 py-3 xs:py-4">
          <div className="sm:flex items-center justify-between gap-2 xs:gap-4">
            
            {/* Logo Section */}
            <div className="flex items-center justify-between">
              <Link href="/" className="hover:opacity-80 transition-opacity duration-200">
                <h1 className="text-xl xs:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ChatHub
                </h1>
              </Link>
              {/* Mobile Controls - Search & Settings */}
            <div className="flex sm:hidden items-center gap-2">
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150 flex-shrink-0"
                onClick={() => setShowSearch(true)}
                aria-label="Open search"
              >
                <Search size={18} className="text-gray-600" />
              </button>
              <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150">
                <Settings size={18} className="text-gray-600" />
              </Link>
            </div>
            </div>

            {/* Desktop Search - Hidden on mobile */}
            <div ref={inputSearchRef} className="hidden sm:block flex-1 max-w-lg mx-4">
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
                  {isFocused && frequentSearches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-64 overflow-y-auto z-50">
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                          Recent Searches
                        </p>
                        {frequentSearches
                          .filter((q) => searchQuery ? q.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                          .slice(0, 5)
                          .map((q, index) => (
                            <div
                              key={index}
                              onClick={() => handleFrequentSearchClick(q)}
                              className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150"
                            >
                              <Search size={14} className="text-gray-400 mr-3 flex-shrink-0" />
                              <span className="text-gray-700 truncate">{q}</span>
                            </div>
                          ))}
                        
                        {/* Current search option */}
                        {searchQuery && !frequentSearches.some(q => q.toLowerCase() === searchQuery.toLowerCase()) && (
                          <div
                            onClick={() => handleFrequentSearchClick(searchQuery)}
                            className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150 border-t border-gray-100 mt-2 pt-4"
                          >
                            <Search size={14} className="text-blue-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 truncate">Search for &qout;{searchQuery}&quot;</span>
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
                      onClick={() => window.innerWidth >= 632 ? setShowNotifications(!showNotifications) : handleNotificationNavigate}
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
            {frequentSearches.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                    Recent Searches
                  </p>
                  {frequentSearches
                    .filter((q) => searchQuery ? q.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                    .slice(0, 8)
                    .map((q, index) => (
                      <div
                        key={index}
                        onClick={() => handleFrequentSearchClick(q)}
                        className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      >
                        <Search size={16} className="text-gray-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 truncate">{q}</span>
                      </div>
                    ))}
                  
                  {/* Current search option */}
                  {searchQuery && !frequentSearches.some(q => q.toLowerCase() === searchQuery.toLowerCase()) && (
                    <div
                      onClick={() => handleFrequentSearchClick(searchQuery)}
                      className="flex items-center px-3 py-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-150 border-t border-gray-100 mt-2 pt-4"
                    >
                      <Search size={14} className="text-blue-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 truncate">Search for &apos;{searchQuery}&apos;</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {frequentSearches.length === 0 && !searchQuery && (
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