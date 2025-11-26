import { fileUploadService, useUpdatePost } from "@/hooks/usePosts";
import { RootState } from "@/libs/redux/store";
import {
  FileText,
  Image,
  Paperclip,
  Play,
  Video,
  X,
  Edit3,
  Save,
  Camera,
  Music,
  EyeIcon,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { errorNotification } from "@/libs/feedback/notification";
import { GlobeAltIcon, LockClosedIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface EditModalProps {
  postId: string;
  onClose: () => void;
}

interface FilePreview {
  file: File;
  preview?: string;
  type: "image" | "video" | "document" | "audio";
}

interface ExistingFile {
  url: string;
  type: "image" | "video" | "document" | "audio";
  name: string;
}

const EditModal = ({ postId, onClose }: EditModalProps) => {
  const { mutate, register, errors, handleSubmit, isPending } =
    useUpdatePost(postId);
  const { posts } = useSelector((state: RootState) => state.post);
  const post = posts.find((post) => post._id === postId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<
    "public" | "friends" | "private"
  >("public");
  const [newFilePreviews, setNewFilePreviews] = useState<FilePreview[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [removedFiles, setRemovedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (post?.images) {
      const processedFiles: ExistingFile[] = post.images.map((url: string) => {
        const fileName = url.split("/").pop() || "unknown";
        const extension = fileName.split(".").pop()?.toLowerCase();

        let type: "image" | "video" | "document" = "image";
        if (["mp4", "webm", "ogg", "mov", "avi"].includes(extension || "")) {
          type = "video";
        } else if (["pdf", "doc", "docx", "txt"].includes(extension || "")) {
          type = "document";
        }

        return { url, type, name: fileName };
      });

      setExistingFiles(processedFiles);
    }
  }, [post]);

  const removeExistingFile = (url: string) => {
    setRemovedFiles((prev) => [...prev, url]);
    setExistingFiles((prev) => prev.filter((file) => file.url !== url));
  };

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
            console.log("🎥 Created video thumbnail for:", file.name);
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

  const onSubmit = (data: { content?: string }) => {
    console.log("📝 Form submission started");
    console.log("📄 Form data:", data);

    const hasContentChanged = data.content !== post?.content;
    const hasFilesChanged = newFiles.length > 0 || removedFiles.length > 0;

    if (!hasContentChanged && !hasFilesChanged) {
      errorNotification("You must change something to update");
      return;
    }

    const keepFiles = existingFiles?.map((file) => file.url);

    const updatedData = {
      content: data.content,
      images: newFiles,
      existingImages: keepFiles,
      removedImages: removedFiles,
    };

    console.log("🚀 Sending post data:", {
      content: updatedData.content,
      newFileCount: updatedData.images?.length || 0,
      existingFileCount: updatedData.existingImages?.length || 0,
      removedFileCount: updatedData.removedImages?.length || 0,
    });

    mutate(updatedData);
  };

  const renderExistingFilePreview = (file: ExistingFile, index: number) => {
    return (
      <div key={`existing-${index}`} className="relative group">
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeExistingFile(file.url)}
            className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
          >
            <X size={14} />
          </button>

          {/* File content */}
          <div className="aspect-square">
            {file.type === "image" && (
              <img
                src={file.url}
                alt={`Existing ${index}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}

            {file.type === "audio" && (
              <audio
                src={file.url}
                loop
                controls
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}

            {file.type === "video" && (
              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                <video
                  src={file.url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                    <Play size={16} className="text-gray-800 ml-0.5" />
                  </div>
                </div>
              </div>
            )}

            {file.type === "document" && (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
                <FileText size={32} className="text-blue-500 mb-2" />
                <span className="text-xs text-blue-700 text-center truncate w-full font-medium">
                  {file.name}
                </span>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="p-2 bg-white bg-opacity-90 backdrop-blur-sm">
            <p className="text-xs font-medium text-gray-800 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
              Existing
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderNewFilePreview = (filePreview: FilePreview, index: number) => {
    const { file, preview, type } = filePreview;

    return (
      <div key={`new-${index}`} className="relative group">
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeNewFile(index)}
            className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
          >
            <X size={14} />
          </button>

          {/* File content */}
          <div className="aspect-square">
            {type === "image" && preview && (
              <img
                src={preview}
                alt={`New preview ${index}`}
                className="w-full h-full object-cover"
              />
            )}

            {type === "video" && (
              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt={`Video thumbnail ${index}`}
                    className="w-full h-full object-cover"
                  />
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
                  <audio
                    src={preview}
                    loop
                    controls
                    className="w-full h-full object-cover"
                  />
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
                  {file.name}
                </span>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="p-2 bg-white bg-opacity-90 backdrop-blur-sm">
            <p className="text-xs font-medium text-gray-800 truncate">
              {file.name}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-1.5"></span>
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

  const totalFiles = existingFiles.length + newFiles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-6 rounded-t-2xl transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Edit3 size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Post</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What&apos;s on your mind?
              </label>
              <textarea
                {...register("content")}
                defaultValue={post?.content}
                placeholder="Share your thoughts..."
                className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={4}
              />
              {errors.content && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* File Previews */}
            {totalFiles > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Media Files
                  </h3>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                      {existingFiles.length} existing
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-1.5"></span>
                      {newFiles.length} new
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {existingFiles.map((file, index) =>
                    renderExistingFilePreview(file, index)
                  )}
                  {newFilePreviews.map((filePreview, index) =>
                    renderNewFilePreview(filePreview, index)
                  )}
                </div>

                {/* File Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{totalFiles}</span> file
                    {totalFiles > 1 ? "s" : ""} total
                    {removedFiles.length > 0 && (
                      <span className="text-red-600 ml-2">
                        • {removedFiles.length} will be removed
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Add Files Section */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
              <div className="text-center">
                <Camera size={32} className="text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  Add more files to your post
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Image size={18} />
                    <span>Images</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Video size={18} />
                    <span>Videos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Paperclip size={18} />
                    <span>Documents</span>
                  </button>
                </div>
              </div>
            </div>

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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center space-x-2 xs:px-6 px-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                <Save size={18} />
                <span>{isPending ? "Updating..." : "Update Post"}</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt,audio/*"
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

export default EditModal;
