'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBlockPost, useDeletePost, useSavePost } from "@/hooks/usePosts";
import { UserAvatar } from "../constant/UserAvatar";
import { 
  MoreHorizontal, 
  X, 
  Edit3, 
  Copy, 
  Bookmark, 
  Ban, 
  Trash2 
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";

interface PostHeaderProps {
  authorId: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string | Date;
  postId: string;
  content: string;
  onEdit: () => void;
  onHide: () => void;
}

const PostHeader: React.FC<PostHeaderProps> = ({
  authorId,
  createdAt,
  postId,
  content,
  onEdit,
  onHide,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { mutate: deletePost } = useDeletePost(postId);
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const { mutate } = useSavePost(postId);
  const { mutate: blockPost } = useBlockPost();

  const isOwner = user?._id === authorId._id;

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;
    return `${Math.floor(seconds / 2592000)}mo`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setShowDropdown(false);
    toast.success("Post copied successfully");
  };

  const handleSave = () => {
    mutate();
    setShowDropdown(false);
  };

  const handleBlockPost = () => {
    blockPost({ postId });
    setShowDropdown(false);
  };

  const handleDelete = () => {
    deletePost();
    setShowDropdown(false);
  };

  const dropdownItems = [
    ...(isOwner ? [{
      icon: Edit3,
      label: "Edit post",
      onClick: () => {
        onEdit();
        setShowDropdown(false);
      },
      color: "text-blue-600",
      hoverBg: "hover:bg-blue-50"
    }] : []),
    {
      icon: Copy,
      label: "Copy text",
      onClick: handleCopy,
      color: "text-gray-700",
      hoverBg: "hover:bg-gray-50"
    },
    {
      icon: Bookmark,
      label: "Save post",
      onClick: handleSave,
      color: "text-green-600",
      hoverBg: "hover:bg-green-50"
    },
    {
      icon: Ban,
      label: "Block post",
      onClick: handleBlockPost,
      color: "text-orange-600",
      hoverBg: "hover:bg-orange-50"
    },
    ...(isOwner ? [{
      icon: Trash2,
      label: "Delete post",
      onClick: handleDelete,
      color: "text-red-600",
      hoverBg: "hover:bg-red-50"
    }] : [])
  ];

  return (
    <div className="flex items-center justify-between p-6 pb-4">
      <div
        onClick={() => router.push(`/profile/${authorId._id}`)}
        className="flex items-center space-x-3 cursor-pointer group"
      >
        <div className="relative">
          <UserAvatar
            username={authorId.username}
            avatar={authorId?.avatar}
            className="w-12 h-12 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200"
          />
          <div className="absolute inset-0 rounded-full bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
            {authorId.username}
          </h3>
          <p className="text-sm text-gray-500">
            {formatTimeAgo(createdAt)} ago
          </p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {/* Dropdown Container */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`p-2 rounded-full transition-all duration-200 ${
              showDropdown 
                ? 'bg-blue-100 text-blue-600 rotate-90' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Backdrop overlay */}
              <div 
                className="fixed inset-0 z-20"
                onClick={() => setShowDropdown(false)}
              />
              
              {/* Dropdown content */}
              <div 
                className="absolute right-0 top-full mt-2 z-30 w-56 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Dropdown items */}
                  <div className="py-1">
                    {dropdownItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={index}
                          onClick={item.onClick}
                          className={`w-full flex items-center space-x-3 px-4 py-3 transition-all duration-150 ${item.hoverBg} ${item.color} group`}
                        >
                          <Icon 
                            size={18} 
                            className="transition-transform duration-150 group-hover:scale-110" 
                          />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onHide}
          className="p-2 hover:bg-red-50 rounded-full transition-all duration-200 text-gray-400 hover:text-red-500 group"
        >
          <X 
            size={18} 
            className="transition-transform duration-200 group-hover:rotate-90" 
          />
        </button>
      </div>
    </div>
  );
};

export default PostHeader;