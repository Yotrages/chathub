import { fileUploadService, useCreatePost } from "@/hooks/usePosts";
import { AppDispatch } from "@/libs/redux/store";
import {
  FileText,
  Image,
  Paperclip,
  Video,
  X,
  Save,
  Camera,
  Music,
  LucidePenBox,
  EyeIcon,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { addPost } from "@/libs/redux/postSlice";
import { GlobeAltIcon, LockClosedIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface CreatePostModalProps {
  onClose?: () => void;
}

interface FilePreview {
  file: File;
  preview?: string;
  type: "image" | "video" | "document" | "audio";
}

const CreatePostModal = ({ onClose }: CreatePostModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<FilePreview[]>([]);
  const [visibility, setVisibility] = useState<
    "public" | "friends" | "private"
  >("public");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const dispatch: AppDispatch = useDispatch();

  const handleSuccess = (data: any) => {
    console.log("✅ Post creation successful:", data);
    setNewFiles([]);
    setNewFilePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    dispatch(addPost(data.post));
    onClose?.()
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

  // const toggleVideoPlay = () => {
  //   if (videoRef.current) {
  //     if (isVideoPlaying) {
  //       videoRef.current.pause();
  //     } else {
  //       videoRef.current.play();
  //     }
  //     setIsVideoPlaying(!isVideoPlaying);
  //   }
  // };

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
      visibility: visibility,
    };

    console.log("🚀 Sending post data:", {
      content: postData.content,
      fileCount: postData.images?.length || 0,
      fileNames: postData.images?.map((f) => f.name) || [],
    });

    mutate(postData);
  };

  const renderNewFilePreview = (filePreview: FilePreview, index: number) => {
    const { file, preview, type } = filePreview;

    return (
      <div key={`new-${index}`} className="relative group">
        <div className=" bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => removeNewFile(index)}
            className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
          >
            <X size={14} />
          </button>

          <div className="aspect-square">
            {type === "image" && preview && (
              <img
                src={preview}
                alt={`New preview ${index}`}
                className="w-full h-full object-cover"
              />
            )}

            {type === "video" && (
              <div className="relative">
                {preview ? (
                  <video
                    ref={videoRef}
                    src={preview}
                    loop
                    controls
                    // onPlay={() => setIsVideoPlaying(true)}
                    // onPause={() => setIsVideoPlaying(false)}
                    className="w-full h-50 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                    <Video size={32} className="text-gray-400" />
                  </div>
                )}
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
          <div className="p-2 bg-white bg-opacity-90">
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

  const totalFiles = newFiles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LucidePenBox size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What&apos;s on your mind?
              </label>
              <textarea
                {...register("content")}
                placeholder="Share your thoughts..."
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    Media Files
                  </h3>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-1.5"></span>
                      {newFiles.length} new
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {newFilePreviews.map((filePreview, index) =>
                    renderNewFilePreview(filePreview, index)
                  )}
                </div>

                {/* File Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{totalFiles}</span> file
                    {totalFiles > 1 ? "s" : ""} selected
                    <span className="ml-2 text-xs">
                      (
                      {
                        newFiles.filter((f) => f.type.startsWith("image/"))
                          .length
                      }{" "}
                      images,{" "}
                      {
                        newFiles.filter((f) => f.type.startsWith("video/"))
                          .length
                      }{" "}
                      videos,{" "}
                      {
                        newFiles.filter(
                          (f) =>
                            !f.type.startsWith("image/") &&
                            !f.type.startsWith("video/")
                        ).length
                      }{" "}
                      documents)
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Add Files Section */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
              <div className="text-center">
                <Camera size={32} className="text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  Add files to your post
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

            {/* Visibility Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <EyeIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-800">
                  Who can see this?
                </h3>
              </div>

              <div className="space-y-3">
                {visibilityOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        visibility === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={(e) =>
                          setVisibility(e.target.value as typeof visibility)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`p-2 rounded-lg ${
                          visibility === option.value
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium ${
                            visibility === option.value
                              ? "text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
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
                className="px-6 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center space-x-2 xs:px-6 px-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                <Save size={18} />
                <span>{isPending ? "Creating..." : "Create Post"}</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
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

export default CreatePostModal;
