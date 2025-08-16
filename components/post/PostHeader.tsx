'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBlockPost, useDeletePost, useSavePost } from "@/hooks/usePosts";
import { UserAvatar } from "../constant/UserAvatar";
import { MoreHorizontal, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
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
  const { mutate: deletePost } = useDeletePost(postId);
  const { user } = useSelector((state: RootState) => state.auth)
  const router = useRouter();
  const { mutate } = useSavePost(postId)
  const { mutate: blockPost } = useBlockPost()

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setShowDropdown(false);
    toast.success("Post copied successfully");
  };

  const handleSave = () => {
    mutate()
  }

  const handleBlockPost = () => {
    blockPost({postId})
  }

  const isOwner = user?.id === authorId._id

  return (
    <div className="flex items-center justify-between p-6 pb-4">
      <div
        onClick={() => router.push(`/profile/${authorId._id}`)}
        className="flex items-center space-x-3"
      >
        <UserAvatar
          username={authorId.username}
          avatar={authorId?.avatar}
          className="w-12 h-12 ring-2 ring-gray-100 cursor-pointer"
        />
        <div>
          <h3 className="font-semibold text-gray-900 truncate">
            {authorId.username}
          </h3>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(createdAt))} ago
          </p>
        </div>
      </div>
      <span className="flex gap-2 items-center">
        <div className="flex flex-col items-center justify-center relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreHorizontal size={20} className="text-gray-500" />
          </button>
          {showDropdown && (
            <div className="absolute top-full flex z-30 rounded-md flex-col transition-all duration-300 ease-in bg-gradient-to-tl from-white via-warning-50 to-gray-100 py-2 px-2 text-black">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onEdit();
                }}
                className="hover:bg-gray-300 py-2 px-4 rounded-md w-full"
              >
                Edit
              </button>
              <button
                onClick={handleCopy}
                className="hover:bg-gray-300 px-4 rounded-md py-2"
              >
                Copy
              </button>
              <button
                onClick={handleSave}
                className="hover:bg-gray-300 px-4 rounded-md py-2"
              >
                Save
              </button>
              <button
                onClick={handleBlockPost}
                className="hover:bg-gray-300 px-4 rounded-md py-2"
              >
                Block
              </button>
              {isOwner && (
                <button
                onClick={() => {
                  deletePost();
                  setShowDropdown(false);
                }}
                className="hover:bg-gray-300 rounded-md px-4 py-2"
              >
                Delete
              </button>
              )}
            </div>
          )}
        </div>
        <button onClick={onHide}>
          <X size={16} />
        </button>
      </span>
    </div>
  );
};

export default PostHeader;
