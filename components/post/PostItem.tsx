"use client";
import { useState, useRef } from "react";
import { useLikePost, useAddComment, useDeletePost, useUpdatePost } from "@/hooks/usePosts";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/redux/store";
import {
  Heart,
  MessageCircle,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "../common/UserAvatar";
import { CommentList } from "./CommentList";
import { Post } from "@/types";

interface PostItemProps {
  post: Post;
}

interface MediaFile {
  url: string;
  type: "image" | "video" | "document";
  name?: string;
}

export const PostItem = ({ post }: PostItemProps) => {
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  const { mutate: likePost } = useLikePost(post._id);
  const { mutate: addComment } = useAddComment(post._id);
  const {mutate: deletePost} = useDeletePost(post._id)
  const {mutate: EditPost} = useUpdatePost(post._id)

  const { _id, authorId, content, createdAt, likes, comments, images } = post;

  // Process media files
  const mediaFiles: MediaFile[] = (images || []).map((url) => {
    // Determine file type based on URL or extension
    const extension = url.split(".").pop()?.toLowerCase();
    let type: "image" | "video" | "document" = "image";

    if (["mp4", "webm", "ogg", "mov", "avi"].includes(extension || "")) {
      type = "video";
    } else if (["pdf", "doc", "docx", "txt"].includes(extension || "")) {
      type = "document";
    }

    return { url, type, name: url.split("/").pop() };
  });

  // Check if current user liked the post
  const isLiked = user ? likes.some((like) => like._id === user.id) : false;
  const isContentLong = content && content.length > 200;
  const displayContent =
    isContentLong && !showFullContent
      ? content.substring(0, 200) + "..."
      : content;

  const handleLike = () => {
    likePost({ isLiked: !isLiked });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim() && user) {
      addComment({
        content: commentContent,
      });
      setCommentContent("");
    }
  };

  const handleEditPost = () => {

  }

  const handleCopy = () => {
    navigator.clipboard.writeText(post.content)
    alert("content copied successfully")
  }

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const renderMediaGallery = () => {
    if (!mediaFiles.length) return null;

    const currentMedia = mediaFiles[currentMediaIndex];

    return (
      <div className="relative mb-4 bg-black rounded-xl overflow-hidden">
        {/* Media Navigation */}
        {mediaFiles.length > 1 && (
          <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-sm font-medium">
              {currentMediaIndex + 1} / {mediaFiles.length}
            </span>
          </div>
        )}

        {/* Main Media Display */}
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          {currentMedia.type === "image" && (
            <img
              src={currentMedia.url}
              alt={`Post media ${currentMediaIndex + 1}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          {currentMedia.type === "video" && (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={currentMedia.url}
                className="w-full h-full object-contain"
                muted={isVideoMuted}
                loop
                playsInline
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />

              {/* Video Controls */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={toggleVideoPlay}
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-4 transition-all duration-200 transform hover:scale-110"
                >
                  {isVideoPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
              </div>

              <div className="absolute bottom-4 right-4 flex space-x-2">
                <button
                  onClick={toggleVideoMute}
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors"
                >
                  {isVideoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>
          )}

          {currentMedia.type === "document" && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900">
              <FileText size={64} className="text-white mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">
                {currentMedia.name || "Document"}
              </h3>
              <a
                href={currentMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={16} />
                <span>Download</span>
              </a>
            </div>
          )}
        </div>

        {/* Media Thumbnails */}
        {mediaFiles.length > 1 && (
          <div className="absolute bottom-4 left-4 flex space-x-2">
            {mediaFiles.map((media, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentMediaIndex
                    ? "border-white shadow-lg"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {media.type === "image" && (
                  <img
                    src={media.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {media.type === "video" && (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <Play size={16} className="text-white" />
                  </div>
                )}
                {media.type === "document" && (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <FileText size={16} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-3">
          <UserAvatar
            username={authorId.username}
            avatar={authorId?.avatar}
            className="w-12 h-12 ring-2 ring-gray-100"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{authorId.username}</h3>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(createdAt))} ago
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreHorizontal size={20} className="text-gray-500" />
          </button>
          {showDropdown && (
            <div className="absolute top-full flex z-30 flex-col transition-all duration-300 ease-in bg-gradient-to-t from-purple-500 via-blue-600 to-violet-600 py-2 px-4 text-black">
                <button onClick={() => EditPost()} className="hover:bg-gray-300 py-2">Edit</button>
                <button onClick={() => deletePost()} className="hover:bg-gray-300 py-2">Delete</button>
                <button onClick={handleCopy} className="hover:bg-gray-300 py-2">Copy</button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {content && (
        <div className="px-6 pb-4">
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">
            {displayContent}
          </p>
          {isContentLong && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-2 transition-colors"
            >
              {showFullContent ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Media Gallery */}
      {renderMediaGallery()}

      {/* Engagement Stats */}
      <div className="px-6 py-3 border-t border-gray-50">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span className="hover:text-gray-800 cursor-pointer transition-colors">
              {likes.length} {likes.length === 1 ? "like" : "likes"}
            </span>
            <span className="hover:text-gray-800 cursor-pointer transition-colors">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <ImageIcon size={14} />
            <span>{mediaFiles.length}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-3 border-t border-gray-50">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-200 ${
              isLiked
                ? "text-red-500 bg-red-50 hover:bg-red-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-red-500"
            }`}
          >
            <Heart
              size={20}
              fill={isLiked ? "currentColor" : "none"}
              className="transition-transform duration-200 hover:scale-110"
            />
            <span className="font-medium">Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-200 ${
              showComments
                ? "text-blue-500 bg-blue-50 hover:bg-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
            }`}
          >
            <MessageCircle size={20} />
            <span className="font-medium">Comment</span>
          </button>

          <button className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-green-500 transition-all duration-200">
            <Share2 size={20} />
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-50 bg-gray-50">
          {/* Add Comment Form */}
          {user && (
            <div className="p-6 pb-4">
              <form onSubmit={handleAddComment} className="flex space-x-3">
                <UserAvatar
                  username={user?.username || "User"}
                  avatar={user?.avatar}
                  className="w-10 h-10 flex-shrink-0"
                />
                <div className="flex-1 flex space-x-6">
                  <input
                    type="text"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={!commentContent.trim()}
                    className="px-4 bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Comments List */}
          <div className="px-6 pb-6">
            <CommentList postId={post._id} comments={comments} />
          </div>
        </div>
      )}
    </article>
  );
};
