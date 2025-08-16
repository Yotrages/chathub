"use client";
import { useState } from "react";
import {
  Image,
  Paperclip,
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";


export const CreatePost = () => {
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false)



  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const selectedFiles = Array.from(e.target.files || []);
  //   const validFiles: File[] = [];
  //   const newPreviews: FilePreview[] = [];

  //   console.log(
  //     "📁 Selected files:",
  //     selectedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
  //   );

  //   for (const file of selectedFiles) {
  //     const validation = fileUploadService.validateFile(file);
  //     if (validation.isValid) {
  //       validFiles.push(file);
  //       const fileType = fileUploadService.getFileType(file);

  //       const filePreview: FilePreview = {
  //         file,
  //         type: fileType,
  //       };

  //       try {
  //         if (fileType === "image") {
  //           filePreview.preview = await fileUploadService.createImagePreview(
  //             file
  //           );
  //           console.log("🖼️ Created image preview for:", file.name);
  //         } else if (fileType === "video") {
  //           filePreview.preview = await fileUploadService.createVideoPreview(
  //             file
  //           );
  //           console.log("🎥 Created video thumbnail for:", file.name);
  //         } else if (fileType === "audio") {
  //           filePreview.preview = await fileUploadService.createAudioPreview(
  //             file
  //           );
  //         }
  //       } catch (error) {
  //         console.error(`❌ Error creating preview for ${file.name}:`, error);
  //       }

  //       newPreviews.push(filePreview);
  //     } else {
  //       console.error(`❌ File ${file.name} is invalid:`, validation.error);
  //       alert(`File ${file.name} is invalid: ${validation.error}`);
  //     }
  //   }

  //   setFiles((prev) => {
  //     const newFiles = [...prev, ...validFiles];
  //     console.log(
  //       "📦 Updated files array:",
  //       newFiles.map((f) => f.name)
  //     );
  //     return newFiles;
  //   });
  //   setFilePreviews((prev) => [...prev, ...newPreviews]);
  // };

  

  return (
    <>
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <form>
        <input
        onFocus={() => setShowCreatePostModal(true)}
        onClick={() => setShowCreatePostModal(true)}
          placeholder="What's on your mind?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />       

        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowCreatePostModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Add files"
            >
              <Image size={20} />
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Add documents (supported)"
              onClick={() => setShowCreatePostModal(true)}
            >
              <Paperclip size={20} />
            </button>
          </div>

        </div>

      </form>
    </div>
    {showCreatePostModal && (
      <CreatePostModal onClose={() => setShowCreatePostModal(false)}/>
    )}
    </>
  );
};
