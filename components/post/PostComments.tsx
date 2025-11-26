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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [previewType, setPreviewType] = useState("");
  const [originalFile, setOriginalFile] = useState<File>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; 
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [commentContent]);

  const extractKeywords = (text: string): string[] => {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 8);
  };

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
    console.log('Expanding memory:', memory);
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
    setPreviewType("");
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
      <div className="px-2 sm:px-4 md:px-6 lg:px-12 relative group">
        <div className="relative w-24 sm:w-28 md:w-32 lg:w-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <button
            type="button"
            onClick={removeFile}
            className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 sm:p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
          >
            <X size={12} className="sm:w-3.5 sm:h-3.5" />
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
                    <Video size={20} className="sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white bg-opacity-90 rounded-full p-1 sm:p-2">
                    <Play size={12} className="sm:w-4 sm:h-4 text-gray-800 ml-0.5" />
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
                    <Music size={20} className="sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                )}
              </div>
            )}
            {type === "document" && (
              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col items-center justify-center p-2 sm:p-4">
                <FileText size={20} className="sm:w-8 sm:h-8 text-purple-500 mb-1 sm:mb-2" />
                <span className="text-xs text-purple-700 text-center truncate w-full font-medium">
                  {file?.name}
                </span>
              </div>
            )}
          </div>
          <div className="p-1 sm:p-2 bg-white bg-opacity-90 backdrop-blur-sm">
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

  const postAuthor = comments.find(comment => comment.authorId._id === postAuthorId);
  const participantUsername = postAuthor?.authorId?.username;

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sticky Comment Input Area at TOP */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-lg z-20 transition-colors duration-200">
        {preview && <div className="pt-3">{renderFilePreview(preview, previewType, originalFile)}</div>}
        
        {user && (
          <div className="py-3 sm:py-4 md:py-6 px-1 xs:px-2 sm:px-4 md:px-6 w-full">
            <form onSubmit={handleAddComment} className="flex items-end gap-2 w-full">
              <UserAvatar
                username={user?.username || "User"}
                avatar={user?.avatar}
                className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 hidden xs:flex"
              />
              
              <button 
                className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors dark:text-gray-400" 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={16} className="sm:w-5 sm:h-5" />
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,audio/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex-1 relative min-w-0">
                <div className="flex relative">
                  <textarea
                    ref={textareaRef}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    rows={1}
                    className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none overflow-hidden text-sm sm:text-base pr-8"
                    style={{ minHeight: '38px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform text-lg"
                  >
                    😊
                  </button>
                </div>
                
                {showEmojiPicker && (
                  <div ref={emojiRef} className="absolute top-full mt-2 right-0 z-[150]">
                    <div className="scale-75 sm:scale-100 origin-top-right">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!commentContent.trim()}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Send size={16} className="sm:w-5 sm:h-5" />
              </button>
            </form>

            {/* Memory Threads Panel */}
            {showMemories && (
              <div className="mt-3 sm:mt-4">
                <MemoryThreadsPanel
                  memories={memoryThreads}
                  isLoading={memoryLoading}
                  onExpandMemory={handleExpandMemory}
                  participantUsername={participantUsername}
                />
              </div>
            )}

            {(postErrors.content || reelErrors.content) && (
              <div className="mt-2 text-center">
                <span className="text-red-500 text-sm">
                  {postErrors.content?.message || reelErrors.content?.message}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Comments Section BELOW Input */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-4 md:px-6 w-full py-4 sm:py-6">
        <CommentList type={type} dynamicId={dynamicId} comments={comments} />
      </div>
    </div>
  );
};

export default PostComments;