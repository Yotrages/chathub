"use client";
import { fileUploadService, useUpdatePost } from "@/hooks/usePosts";
import { RootState } from "@/libs/redux/store";
import {
  FileText,
  Image,
  Paperclip,
  Play,
  Video,
  X,
  Camera,
  Music,
  Eye,
  ArrowLeft,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { errorNotification } from "@/libs/feedback/notification";
import {
  GlobeAltIcon,
  LockClosedIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";

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

const EditModal = () => {
  const { id: postId } = useParams();
  const { mutate, register, errors, handleSubmit, isPending } = useUpdatePost(
    postId as any
  );
  const router = useRouter();
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
          } else if (fileType === "video") {
            filePreview.preview = await fileUploadService.createVideoPreview(
              file
            );
          } else if (fileType === "audio") {
            filePreview.preview = await fileUploadService.createAudioPreview(
              file
            );
          }
        } catch (error) {
          console.error(`Error creating preview for ${file.name}:`, error);
        }

        newPreviews.push(filePreview);
      } else {
        alert(`File ${file.name} is invalid: ${validation.error}`);
      }
    }

    setNewFiles((prev) => [...prev, ...validFiles]);
    setNewFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const onSubmit = (data: { content?: string }) => {
    const hasContentChanged = data.content !== post?.content;
    const hasFilesChanged = newFiles.length > 0 || removedFiles.length > 0;

    if (!hasContentChanged && !hasFilesChanged) {
      errorNotification("You must change something to update");
      return;
    }

    const keepFiles = existingFiles.map((file) => file.url);

    const updatedData = {
      content: data.content,
      images: newFiles,
      existingImages: keepFiles,
      removedImages: removedFiles,
    };

    mutate(updatedData);
  };

  const renderExistingFilePreview = (file: ExistingFile, index: number) => {
    return (
      <div key={`existing-${index}`} className="relative group">
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => removeExistingFile(file.url)}
            className="absolute top-1 right-1 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all"
          >
            <X size={12} />
          </button>

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
                  <div className="bg-white bg-opacity-90 rounded-full p-1.5">
                    <Play size={12} className="text-gray-800 ml-0.5" />
                  </div>
                </div>
              </div>
            )}

            {file.type === "document" && (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-2">
                <FileText size={20} className="text-blue-500 mb-1" />
                <span className="text-[10px] text-blue-700 text-center truncate w-full font-medium px-1">
                  {file.name}
                </span>
              </div>
            )}
          </div>

          <div className="p-1.5 bg-white bg-opacity-90 backdrop-blur-sm">
            <p className="text-[10px] font-medium text-gray-800 truncate">
              {file.name}
            </p>
            <p className="text-[9px] text-gray-500 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
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
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => removeNewFile(index)}
            className="absolute top-1 right-1 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all"
          >
            <X size={12} />
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
              <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt={`Video thumbnail ${index}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Video size={20} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white bg-opacity-90 rounded-full p-1.5">
                    <Play size={12} className="text-gray-800 ml-0.5" />
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
                    <Music size={20} className="text-gray-400" />
                  </div>
                )}
              </div>
            )}

            {type === "document" && (
              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col items-center justify-center p-2">
                <FileText size={20} className="text-purple-500 mb-1" />
                <span className="text-[10px] text-purple-700 text-center truncate w-full font-medium px-1">
                  {file.name}
                </span>
              </div>
            )}
          </div>

          <div className="p-1.5 bg-white bg-opacity-90 backdrop-blur-sm">
            <p className="text-[10px] font-medium text-gray-800 truncate">
              {file.name}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-gray-500 flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></span>
                New
              </p>
              <p className="text-[9px] text-gray-500">
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
      value: "public",
      label: "Public",
      description: "Anyone can see this post",
      icon: GlobeAltIcon,
    },
    {
      value: "friends",
      label: "Followers",
      description: "Only your followers can see this",
      icon: UserGroupIcon,
    },
    {
      value: "private",
      label: "Only me",
      description: "Only you can see this post",
      icon: LockClosedIcon,
    },
  ];

  const totalFiles = existingFiles.length + newFiles.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="sticky top-0 h-full w-full bg-white border-b border-gray-200 z-20"
      >
        <div className="flex items-center justify-between px-3 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">Edit Post</h1>
          <button
            type="submit"
            form="edit-post-form"
            disabled={isPending}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="pb-4">
        <form
          id="edit-post-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="bg-white px-3 py-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              What&apos;s on your mind?
            </label>
            <textarea
              {...register("content")}
              defaultValue={post?.content}
              placeholder="Share your thoughts..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows={4}
            />
            {errors.content && (
              <p className="text-red-500 text-xs mt-1.5">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* File Previews */}
          {totalFiles > 0 && (
            <div className="bg-white px-3 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-gray-700">
                  Media Files
                </h3>
                <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                    {existingFiles.length}
                  </span>
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></span>
                    {newFiles.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {existingFiles.map((file, index) =>
                  renderExistingFilePreview(file, index)
                )}
                {newFilePreviews.map((filePreview, index) =>
                  renderNewFilePreview(filePreview, index)
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">{totalFiles}</span> file
                  {totalFiles > 1 ? "s" : ""} total
                  {removedFiles.length > 0 && (
                    <span className="text-red-600 ml-1">
                      • {removedFiles.length} removed
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Add Files Section */}
          <div className="bg-white px-3 py-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-3">
              <div className="text-center">
                <Camera size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-3">Add more files</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Image size={14} />
                    <span>Images</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Video size={14} />
                    <span>Videos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Paperclip size={14} />
                    <span>Docs</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visibility Options */}
          <div className="bg-white px-3 py-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Who can see this?
              </h3>
            </div>

            <div className="space-y-2">
              {visibilityOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-start space-x-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
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
                      className={`p-1.5 rounded-lg flex-shrink-0 ${
                        visibility === option.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-medium ${
                          visibility === option.value
                            ? "text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </div>
                      <div className="text-[11px] text-gray-500 leading-tight">
                        {option.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
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
  );
};

export default EditModal;
