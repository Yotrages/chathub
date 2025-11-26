'use client'
import {
  fileUploadService,
  useCreatePost,
} from "@/hooks/usePosts";
import { AppDispatch } from "@/libs/redux/store";
import {
  FileText,
  Image,
  Paperclip,
  Video,
  X,
  Camera,
  Music,
  ArrowLeft,
  EyeIcon,
  Plus,
  PenTool
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useDispatch} from "react-redux";
import { addPost } from "@/libs/redux/postSlice";
import { GlobeAltIcon, LockClosedIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface FilePreview {
  file: File;
  preview?: string;
  type: "image" | "video" | "document" | "audio";
}

const CreatePostPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<FilePreview[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const dispatch: AppDispatch = useDispatch();
  const router = useRouter()

  const handleSuccess = (data: any) => {
    console.log("✅ Post creation successful:", data);
    setNewFiles([]);
    setNewFilePreviews([]);
    setVisibility('public');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    dispatch(addPost(data.post));
    router.back()
  };

  const { mutate, isPending, register, handleSubmit, errors } =
    useCreatePost(handleSuccess);

  const removeNewFile = (index: number) => {
    console.log("🗑️ Removing new file at index:", index);
    if (
      newFilePreviews[index]?.preview &&
      newFilePreviews[index].preview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(newFilePreviews[index].preview!);
    }
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewFilePreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const newPreviews: FilePreview[] = [];

    console.log(
      "📁 Selected files:",
      selectedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

    for (const file of selectedFiles) {
      const validation = fileUploadService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
        const fileType = fileUploadService.getFileType(file);

        const filePreview: FilePreview = {
          file,
          type: fileType,
        };

        try {
          if (fileType === "image") {
            filePreview.preview = await fileUploadService.createImagePreview(
              file
            );
            console.log("🖼️ Created image preview for:", file.name);
          } else if (fileType === "video") {
            filePreview.preview = await fileUploadService.createVideoPreview(
              file
            );
            console.log("🎥 Created video thumbnail for:", file.name);
          } else if (fileType === "audio") {
            filePreview.preview = await fileUploadService.createAudioPreview(
              file
            );
            console.log("🎵 Created audio preview for:", file.name);
          }
        } catch (error) {
          console.error(`❌ Error creating preview for ${file.name}:`, error);
        }

        newPreviews.push(filePreview);
      } else {
        console.error(`❌ File ${file.name} is invalid:`, validation.error);
        alert(`File ${file.name} is invalid: ${validation.error}`);
      }
    }

    setNewFiles((prev) => {
      const updatedFiles = [...prev, ...validFiles];
      console.log(
        "📦 Updated files array:",
        updatedFiles.map((f) => f.name)
      );
      return updatedFiles;
    });
    setNewFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const onSubmit = (data: { content: string }) => {
    console.log("📝 Form submission started");
    console.log("📄 Form data:", data);
    console.log(
      "📁 Files to upload:",
      newFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      }))
    );

    if (!data.content.trim() && newFiles.length === 0) {
      alert("Post must have content or files");
      return;
    }

    const postData = {
      content: data.content,
      images: newFiles,
      visibility: visibility
    };

    console.log("🚀 Sending post data:", {
      content: postData.content,
      fileCount: postData.images?.length || 0,
      fileNames: postData.images?.map((f) => f.name) || [],
      visibility: postData.visibility
    });

    mutate(postData);
  };

  const renderNewFilePreview = (filePreview: FilePreview, index: number) => {
    const { file, preview, type } = filePreview;

    return (
      <div key={`new-${index}`} className="relative group">
        <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md transition-colors duration-200">
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeNewFile(index)}
            className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1.5 shadow-lg active:scale-95 transition-transform"
          >
            <X size={14} />
          </button>

          {/* File content */}
          <div className="aspect-square">
            {type === "image" && preview && (
              <img
                src={preview}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover"
              />
            )}

            {type === "video" && (
              <div className="relative w-full h-full">
                {preview ? (
                  <video
                    ref={videoRef}
                    src={preview}
                    loop
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Video size={32} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
            )}

            {type === "audio" && (
              <div className="relative w-full h-full bg-gray-900 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                {preview ? (
                  <div className="w-full">
                    <div className="flex flex-col items-center mb-3">
                      <Music size={32} className="text-white mb-2" />
                      <span className="text-white text-xs text-center truncate w-full">
                        {file.name}
                      </span>
                    </div>
                    <audio
                      src={preview}
                      controls
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-800 dark:bg-gray-800 flex items-center justify-center">
                    <Music size={32} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
            )}

            {type === "document" && (
              <div className="w-full h-full bg-gradient-to-br from-purple-50 dark:from-purple-900/30 to-purple-100 dark:to-purple-800/30 flex flex-col items-center justify-center p-4">
                <FileText size={32} className="text-purple-500 dark:text-purple-400 mb-2" />
                <span className="text-xs text-purple-700 dark:text-purple-300 text-center truncate w-full font-medium">
                  {file.name}
                </span>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="p-2 bg-white">
            <p className="text-xs font-medium text-gray-800 truncate">
              {file.name}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                New
              </p>
              <p className="text-xs text-gray-500">
                {fileUploadService.formatFileSize(file.size)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const visibilityOptions = [
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone can see this post',
      icon: GlobeAltIcon
    },
    {
      value: 'friends',
      label: 'Followers',
      description: 'Only your followers can see this',
      icon: UserGroupIcon
    },
    {
      value: 'private',
      label: 'Only me',
      description: 'Only you can see this post',
      icon: LockClosedIcon
    }
  ];

  const totalFiles = newFiles.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 px-4 py-3 shadow-lg dark:shadow-xl transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
              disabled={isPending}
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <PenTool className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Create Post</h1>
                <p className="text-blue-100 text-xs">Share your thoughts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Content Input */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <label className="block text-base font-medium text-gray-700 mb-3">
                What&apos;s on your mind?
              </label>
              <textarea
                {...register("content")}
                placeholder="Share your thoughts..."
                className="w-full p-4 border overflow-hidden border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-base"
                rows={4}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* File Previews */}
            {totalFiles > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">
                    Media Files
                  </h3>
                  <div className="text-sm text-gray-500">
                    {totalFiles} file{totalFiles > 1 ? "s" : ""}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {newFilePreviews.map((filePreview, index) =>
                    renderNewFilePreview(filePreview, index)
                  )}
                </div>

                {/* File Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{totalFiles}</span> file{totalFiles > 1 ? "s" : ""} selected
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    <span>
                      📸 {newFiles.filter((f) => f.type.startsWith("image/")).length} images
                    </span>
                    <span>
                      🎥 {newFiles.filter((f) => f.type.startsWith("video/")).length} videos
                    </span>
                    <span>
                      📄 {newFiles.filter((f) => !f.type.startsWith("image/") && !f.type.startsWith("video/") && !f.type.startsWith("audio/")).length} docs
                    </span>
                    <span>
                      🎵 {newFiles.filter((f) => f.type.startsWith("audio/")).length} audio
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Add Files Section */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Add Media</h3>
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <div className="text-center">
                  <Camera size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-4">
                    Add files to your post
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center space-y-2 p-3 bg-blue-500 text-white rounded-lg active:scale-95 transition-transform"
                    >
                      <Image size={20} />
                      <span className="text-xs">Photos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center space-y-2 p-3 bg-green-500 text-white rounded-lg active:scale-95 transition-transform"
                    >
                      <Video size={20} />
                      <span className="text-xs">Videos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center space-y-2 p-3 bg-purple-500 text-white rounded-lg active:scale-95 transition-transform"
                    >
                      <Paperclip size={20} />
                      <span className="text-xs">Files</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <EyeIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-800">Who can see this?</h3>
              </div>
              
              <div className="space-y-3">
                {visibilityOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <label 
                      key={option.value}
                      className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        visibility === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                        className="sr-only"
                      />
                      <div className={`p-2 rounded-lg ${
                        visibility === option.value 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          visibility === option.value ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500 leading-tight">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

      {/* Fixed Bottom Button - Outside Form */}
      <div className="sticky min-w-full bottom-0 bg-white border-t border-gray-200 p-4 shadow-2xl z-10">
        <button
        type="submit"
          onClick={() => handleSubmit(onSubmit)}
          disabled={isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-xl active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-2"
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span>Create Post</span>
            </>
          )}
        </button>
      </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </form>
        </div>
      </div>

    </div>
  );
};

export default CreatePostPage;