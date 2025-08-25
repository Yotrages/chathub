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
   const [showSearch, setShowSearch] = useState(false)
   const inputSearchRef = useRef<HTMLDivElement | null>(null)
  const { user } = useSelector(
    (state: RootState) => state.auth
  );

   useEffect(() => {
    const fetchFrequentSearches = async () => {
      const res = await api.get("/search/tracking");
      if (res.status === 200) {
        const data = await res.data;
        setFrequentSearches(data.searches.map((s: any) => s.query));
      }
    };
    fetchFrequentSearches();
  }, []);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search/${searchQuery.trim()}`);
    }
  };

  // Handle search modal close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
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
            setShowSearch(false);
          }
        };
    
        if (showSearch) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, [showSearch]);

  const handleNotificationNavigate = () => {
    router.push('/notification');
    setShowNotifications(false);
  };

  return (
    <div className="bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-2 xs:px-4 py-3 xs:py-4">
          <div className="sm:flex items-center xs:gap-4 justify-between">
            <div className="flex items-center mb-2 justify-between sm:space-x-4 min-w-0 flex-1">
              <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
                <h1 className="text-[min(10vw,24px)] font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ChatHub
                </h1>
              </Link>
              
              {/* Desktop Search */}
              <div ref={inputSearchRef} className="hidden sm:block flex-1 max-w-md">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className={`relative w-full ${isFocused ? "rounded-t-lg" : "rounded-lg"} transition-all duration-200`}>
                    <Input
                      className="w-full"
                      icon={<Search size={15} />}
                      left_content
                      placeholder="Search posts, users, reels..."
                      width="100%"
                      border_radius="9999px"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                    {isFocused && searchQuery && frequentSearches.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-lg shadow-md mt-1 max-h-48 overflow-y-auto z-10">
                        {frequentSearches
                          .filter((q) => q.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((q, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setSearchQuery(q);
                                handleSearchSubmit(new Event("submit") as any);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {q}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="flex sm:hidden items-center space-x-4">
              {/* Mobile Search Button */}
               <button 
                className="p-1.5 xs:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                onClick={() => setShowSearch(true)}
                aria-label="Open search"
              >
                <Search size={18} />
              </button>
                    <Link href={`/settings`}>
                      <Settings size={18} />
                    </Link>
              </div>
            </div>

            <div className="flex justify-between items-center sm:space-x-4">
             
              {/* Navigation Links */}
              <nav className="flex flex-1 items-center justify-between sm:gap-5">
                {NavLinks.map((item, index) => (
                  <Link
                    href={item.route}
                    key={index}
                    className="flex flex-col items-center justify-center p-1 xs:p-2 rounded-lg min-w-0"
                  >
                    <span className="text-gray-600 hover:text-gray-900">
                      {item.icon}
                    </span>
                    <p className="text-xs text-gray-600 hidden md:flex truncate mt-1 whitespace-nowrap">
                      {item.name}
                    </p>
                  </Link>
                ))}
                
                {/* Notification Icon with Dropdown */}
                <div className="relative">
                  {user && (
                    <NotificationIcon 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="flex flex-col items-center justify-center rounded-lg min-w-0"
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
              {/* User Profile Button */}
              <button
                onClick={() => router.push(`/profile/${user?._id}`)}
                className="flex items-center space-x-1 xs:space-x-2 text-gray-700 hover:text-gray-900 p-1 xs:p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-0"
              >
                <div className="w-7 h-7 xs:w-8 xs:h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.username}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs xs:text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <span className="font-medium hidden sm:flex truncate max-w-20 md:max-w-none">
                  {user?.username}
                </span>
              </button>
              </nav>

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      {showSearch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 top-0 z-50 p-4"
        >
          <div className="sm:hidden flex-1 max-w-xs">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className={`relative w-full ${isFocused ? "rounded-t-lg" : "rounded-lg"} transition-all duration-200`}>
                    <Input
                      className="w-full"
                      icon={<Search size={15} />}
                      left_content
                      placeholder="Search posts, users, reels..."
                      width="100%"
                      border_radius="9999px"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                    {isFocused && searchQuery && frequentSearches.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-lg shadow-md mt-1 max-h-48 overflow-y-auto z-10">
                        {frequentSearches
                          .filter((q) => q.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((q, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setSearchQuery(q);
                                handleSearchSubmit(new Event("submit") as any);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {q}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>
        </div>
      )}
    </div>
  );
};

export default Header;
