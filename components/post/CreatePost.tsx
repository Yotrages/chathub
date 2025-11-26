"use client";
import { useState } from "react";
import {
  Image,
  Video,
  Smile,
  MapPin,
  TrendingUp,
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import { UserAvatar } from "../constant/UserAvatar";

export const CreatePost = () => {
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleShow = () => {
    if (window.innerWidth < 768) {
      router.push('/post/create');
    } else {
      setShowCreatePostModal(true);
    }
  };

  const quickActions = [
    { icon: Image, label: "Photo", color: "text-green-600", bgColor: "bg-green-50 hover:bg-green-100" },
    { icon: Video, label: "Video", color: "text-red-600", bgColor: "bg-red-50 hover:bg-red-100" },
    { icon: Smile, label: "Feeling", color: "text-yellow-600", bgColor: "bg-yellow-50 hover:bg-yellow-100" },
    { icon: MapPin, label: "Location", color: "text-blue-600", bgColor: "bg-blue-50 hover:bg-blue-100" },
  ];

  return (
    <>
      <div className="bg-gradient-to-br from-white dark:from-gray-800 to-gray-50 dark:to-gray-900 rounded-xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        {/* Header with gradient accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <div className="py-4 sm:px-4 px-2 w-full max-w-full">
          <div className="flex items-center max-w-full gap-3 mb-4">
            <div className="relative">
              <UserAvatar username={user?.username} avatar={user?.avatar} className="w-10 h-10"/>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            
            <button
              onClick={handleShow}
              className="flex-1 text-left max-w-full px-5 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400 transition-all duration-200 hover:shadow-md group"
            >
              <span className="group-hover:text-gray-700 dark:group-hover:text-gray-300 text-sm select-none w-full truncate">Share your thoughts, {user?.username?.split(' ')[0] || 'there'}?</span>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-3"></div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={handleShow}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-200 ${action.bgColor} dark:bg-gray-700 dark:hover:bg-gray-600 group`}
              >
                <action.icon size={20} className={`${action.color} group-hover:scale-110 transition-transform`} />
                <span className={`text-sm font-medium ${action.color} hidden sm:inline`}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          {/* Optional: Trending Topics Hint */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
            <TrendingUp size={14} className="text-blue-500" />
            <span>Trending: #TechNews, #MondayMotivation, #Photography</span>
          </div>
        </div>
      </div>

      {showCreatePostModal && (
        <CreatePostModal onClose={() => setShowCreatePostModal(false)} />
      )}
    </>
  );
};