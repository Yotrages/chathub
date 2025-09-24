import { fileUploadService } from "@/hooks/usePosts";
import { UserAvatar } from "../constant/UserAvatar";
import { FileText, Image, Music, Play, Send, Video, X } from "lucide-react";
import { useAddComment } from "@/hooks/usePosts";
import { useAddReelComment } from "@/hooks/useReels";
import { useEffect, useRef, useState } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface ReplyFormProps {
  type: "post" | "reel";
  dynamicId: string;
  commentId: string;
  username: string;
  avatar: string;
  onClose: () => void;
  parentCommentId?: string;
}

export const ReplyForm: React.FC<ReplyFormProps> = ({
  dynamicId,
  // commentId,
  username,
  avatar,
  onClose,
  type,
  parentCommentId,
}) => {
  const { mutate: addComment, errors } = useAddComment(dynamicId, () => {
    setReplyContent("");
    setPreview("");
    setOriginalFile(undefined);
    onClose();
  });
  const { mutate: addReelComment, errors: reelErrors } = useAddReelComment(dynamicId, () => {
    setReplyContent("");
    setPreview("");
    setOriginalFile(undefined);
    onClose();
  });
  const [preview, setPreview] = useState<string>("");
  const [previewType, setPreviewType] = useState("");
  const [originalFile, setOriginalFile] = useState<File>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const payload = {
      content: replyContent,
      file: originalFile,
      parentCommentId: parentCommentId || undefined,
    };

    if (type === "post") {
      addComment(payload);
    } else {
      addReelComment(payload);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setReplyContent((prev) => prev + emojiData.emoji);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyContent(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Auto-resize on content change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [replyContent]);

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
      <div className="px-2 sm:px-6 md:px-12 mb-2 relative group w-full overflow-x-auto">
        <div className="relative w-24 xs:w-32 sm:w-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 mx-auto sm:mx-0">
          <button
            type="button"
            onClick={removeFile}
            className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 sm:p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
          >
            <X size={10} className="sm:hidden" />
            <X size={14} className="hidden sm:block" />
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
                    <Video size={20} className="text-gray-400 sm:w-8 sm:h-8" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white bg-opacity-90 rounded-full p-1 sm:p-2">
                    <Play size={12} className="text-gray-800 ml-0.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </div>
            )}
            {type === "audio" && (
              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                {preview ? (
                  <audio src={preview} loop controls className="w-full h-full object-cover text-xs" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Music size={20} className="text-gray-400 sm:w-8 sm:h-8" />
                  </div>
                )}
              </div>
            )}
            {type === "document" && (
              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col items-center justify-center p-2 sm:p-4">
                <FileText size={20} className="text-purple-500 mb-1 sm:mb-2 sm:w-8 sm:h-8" />
                <span className="text-xs text-purple-700 text-center truncate w-full font-medium px-1">
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

  return (
    <div className="mt-3 sm:mt-4 flex-col ml-1 sm:ml-3 w-full max-w-full overflow-hidden">
      {preview && <span className="block w-full">{renderFilePreview(preview, previewType, originalFile)}</span>}
      <div className="flex gap-1 sm:gap-2 items-start w-full min-w-0">
        <UserAvatar 
          username={username} 
          avatar={avatar} 
          className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 hidden xs:flex" 
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Image size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,audio/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <form onSubmit={onSubmit} className="flex items-end w-full min-w-0 relative">
          <div className="relative w-full min-w-0">
            <textarea
              ref={textareaRef}
              value={replyContent}
              onChange={handleTextareaChange}
              placeholder={`Reply to ${username}...`}
              rows={1}
              className="w-full bg-gray-50 rounded-2xl sm:rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all resize-none overflow-hidden pr-16 sm:pr-20 min-h-[36px] sm:min-h-[40px]"
              style={{ 
                minHeight: '36px',
                maxHeight: '120px',
                lineHeight: '1.4'
              }}
            />
            <div className="absolute flex items-center gap-1 sm:gap-2 right-2 sm:right-3 bottom-2 sm:bottom-2.5">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:scale-110 transition-transform text-sm sm:text-base flex-shrink-0"
              >
                😊
              </button>
              <button 
                type="submit" 
                disabled={!replyContent.trim()}
                className="flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </button>
            </div>
          </div>
          {showEmojiPicker && (
            <div 
              ref={emojiRef} 
              className="absolute bottom-full right-0 z-50 mb-2"
              style={{
                transform: window.innerWidth < 400 ? 'translateX(-50%)' : 'none',
                right: window.innerWidth < 400 ? '50%' : '0'
              }}
            >
              <div className="max-w-[280px] xs:max-w-none">
                <EmojiPicker 
                  onEmojiClick={handleEmojiClick}
                  width={Math.min(320, window.innerWidth - 20)}
                  height={Math.min(400, window.innerHeight * 0.4)}
                />
              </div>
            </div>
          )}
        </form>
      </div>
      {(errors.content || reelErrors.content) && (
        <span className="text-red-500 mt-2 text-center text-xs sm:text-sm block w-full px-2">
          {errors.content?.message || reelErrors.content?.message}
        </span>
      )}
    </div>
  );
};