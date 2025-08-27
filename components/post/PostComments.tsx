"use client";

import { fileUploadService, useAddComment } from "@/hooks/usePosts";
import { UserAvatar } from "../constant/UserAvatar";
import { FileText, Image, Music, Play, Send, Video, X } from "lucide-react";
import { IComment, User } from "@/types";
import { useAddReelComment } from "@/hooks/useReels";
import { useEffect, useRef, useState } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { CommentList } from "../comment/CommentList";
import { useMemoryThreads } from "@/hooks/useMemoryThread";
import { MemoryThreadsPanel } from "../memory/MemoryThreadsPanel";

interface PostCommentsProps {
  type: "post" | "reel";
  dynamicId: string;
  comments: IComment[];
  user: User | null;
  commentContent: string;
  setCommentContent: (content: string) => void;
  postAuthorId?: string; 
}

const PostComments: React.FC<PostCommentsProps> = ({
  dynamicId,
  type,
  comments,
  user,
  commentContent,
  setCommentContent,
  postAuthorId,
}) => {
  const { mutate: addPostComment, errors: postErrors } = useAddComment(dynamicId, () => {
    setCommentContent("");
    setPreview("");
    setOriginalFile(undefined);
    processNewComment();
  });
  
  const { mutate: addReelComment, errors: reelErrors } = useAddReelComment(dynamicId, () => {
    setCommentContent("");
    setPreview("");
    setOriginalFile(undefined);
    processNewComment();
  });

  const {
    memoryThreads,
    isLoading: memoryLoading,
    fetchMemoryThreads,
    clearMemoryThreads,
    processContent,
  } = useMemoryThreads();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [previewType, setPreviewType] = useState("");
  const [originalFile, setOriginalFile] = useState<File>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  // Extract keywords from comment text
  const extractKeywords = (text: string): string[] => {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 8);
  };

  // Process new comment for memory thread creation
  const processNewComment = () => {
    if (user && postAuthorId && commentContent.trim()) {
      const participants = [user._id, postAuthorId].filter(id => id);
      if (participants.length === 2) {
        processContent({
          userId: user._id,
          content: commentContent,
          participants,
          postId: dynamicId,
        });
      }
    }
  };

  // Trigger memory search when comment content changes
  useEffect(() => {
    if (commentContent.length > 20 && user && postAuthorId && user._id !== postAuthorId) {
      const keywords = extractKeywords(commentContent);
      if (keywords.length > 0) {
        fetchMemoryThreads({
          userId: user._id,
          participantId: postAuthorId,
          keywords,
        });
        setShowMemories(true);
      }
    } else {
      setShowMemories(false);
      clearMemoryThreads();
    }
  }, [commentContent, user, postAuthorId, fetchMemoryThreads, clearMemoryThreads]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentContent.trim() && user) {
      const payload = { content: commentContent, file: originalFile, fileType: previewType };
      if (type === "post") {
        addPostComment(payload);
      } else {
        addReelComment(payload);
      }
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setCommentContent(commentContent + emojiData.emoji);
  };

  const handleExpandMemory = (memory: any) => {
    // In a real implementation, this would open a detailed memory view
    console.log('Expanding memory:', memory);
    // You could open a modal, navigate to a detail page, etc.
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const validation = fileUploadService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
        const fileType = fileUploadService.getFileType(file);
        setPreviewType(fileType);
        setOriginalFile(file);

        try {
          if (fileType === "image") {
            const filePreview = await fileUploadService.createImagePreview(file);
            setPreview(filePreview);
          } else if (fileType === "video") {
            const filePreview = await fileUploadService.createVideoPreview(file);
            setPreview(filePreview);
          } else if (fileType === "audio") {
            const filePreview = await fileUploadService.createAudioPreview(file);
            setPreview(filePreview);
          }
        } catch (error) {
          console.error(`Error creating preview for ${file.name}:`, error);
          alert(`File ${file.name} is invalid: ${error}`);
        }
      } else {
        console.error(`File ${file.name} is invalid:`, validation.error);
        alert(`File ${file.name} is invalid: ${validation.error}`);
      }
    }
  };

  const removeFile = () => {
    setPreview("");
    setPreviewType("")
    setOriginalFile(undefined);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const renderFilePreview = (preview: string, type: string, file: File | undefined) => {
    return (
      <div className="px-12 relative group">
        <div className="relative w-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <button
            type="button"
            onClick={removeFile}
            className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
          >
            <X size={14} />
          </button>
          <div className="aspect-square">
            {type === "image" && preview && (
              <img src={preview} alt="New preview" className="w-full h-full object-cover" />
            )}
            {type === "video" && (
              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt="Video thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Video size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                    <Play size={16} className="text-gray-800 ml-0.5" />
                  </div>
                </div>
              </div>
            )}
            {type === "audio" && (
              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                {preview ? (
                  <audio src={preview} loop controls className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Music size={32} className="text-gray-400" />
                  </div>
                )}
              </div>
            )}
            {type === "document" && (
              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col items-center justify-center p-4">
                <FileText size={32} className="text-purple-500 mb-2" />
                <span className="text-xs text-purple-700 text-center truncate w-full font-medium">
                  {file?.name}
                </span>
              </div>
            )}
          </div>
          <div className="p-2 bg-white bg-opacity-90 backdrop-blur-sm">
            <p className="text-xs font-medium text-gray-800 truncate">{file?.name}</p>
            <div className="flex items-center justify-between">
              {file && (
                <p className="text-xs text-gray-500">
                  {fileUploadService.formatFileSize(file.size)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Find the post author's username for display
  const postAuthor = comments.find(comment => comment.authorId._id === postAuthorId);
  const participantUsername = postAuthor?.authorId?.username;

  return (
    <div className="border-t border-gray-50 bg-gray-50 w-full">
      {preview && <span>{renderFilePreview(preview, previewType, originalFile)}</span>}
      
      {user && (
        <div className="py-6 xs:px-6 pb-4 w-full">
          <form onSubmit={handleAddComment} className="flex space-x-3 w-full">
            <UserAvatar
              username={user?.username || "User"}
              avatar={user?.avatar}
              className="w-10 h-10 flex-shrink-0 xs:flex hidden"
            />
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              <Image size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt,audio/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex-1 relative flex space-x-2 xs:space-x-6">
              <span className="flex flex-1 relative">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-2 bottom-2 hover:scale-110 transition-transform"
                >
                  😊
                </button>
              </span>
              <button
                type="submit"
                disabled={!commentContent.trim()}
                className="px-4 bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
              {showEmojiPicker && (
                <div ref={emojiRef} className="absolute bottom-12 right-0 z-10">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
          </form>

          {/* Memory Threads Panel */}
          {showMemories && (
            <MemoryThreadsPanel
              memories={memoryThreads}
              isLoading={memoryLoading}
              onExpandMemory={handleExpandMemory}
              participantUsername={participantUsername}
            />
          )}

          {(postErrors.content || reelErrors.content) && (
            <span className="text-red-500 mt-2 text-center">
              {postErrors.content?.message || reelErrors.content?.message}
            </span>
          )}
        </div>
      )}
      
      <div className="sm:px-6 px-0 w-full pb-6">
        <CommentList type={type} dynamicId={dynamicId} comments={comments} />
      </div>
    </div>
  );
};

export default PostComments;
