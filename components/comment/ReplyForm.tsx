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

  return (
    <div className="mt-3 flex-col ml-3">
      {preview && <span>{renderFilePreview(preview, previewType, originalFile)}</span>}
      <div className="flex gap-2">
        <UserAvatar username={username} avatar={avatar} className="w-8 h-8" />
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
        <form onSubmit={onSubmit} className="flex items-center justify-center relative w-full flex-1">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Reply to ${username}...`}
            className="w-full bg-gray-50 rounded-full px-3 py-2 text-sm border-none outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <span className="absolute flex items-center gap-2 right-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="hover:scale-110 transition-transform"
            >
              😊
            </button>
            <button type="submit" disabled={!replyContent.trim()}>
              <Send className="w-6 h-6 text-black" />
            </button>
          </span>
          {showEmojiPicker && (
            <div ref={emojiRef} className="absolute bottom-12 right-0 z-10">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </form>
      </div>
      {errors.content || (reelErrors.content && (
        <span className="text-red-500 mt-2 text-center">
          {errors.content?.message || reelErrors.content?.message}
        </span>
      ))}
    </div>
  );
};