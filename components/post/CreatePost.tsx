// components/posts/CreatePost.tsx
'use client';
import { useState, useRef } from 'react';
import { useCreatePost } from '@/hooks/usePosts';
import { fileUploadService } from '@/hooks/usePosts'; // Updated import
import { Image, Video, Paperclip, X, FileText, Play } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/libs/redux/store';
import { addPost } from '@/libs/redux/postSlice';

interface FilePreview {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
}

export const CreatePost = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch: AppDispatch = useDispatch()
  const handleSuccess = (data: any) => {
    console.log('✅ Post creation successful:', data);
    setFiles([]);
    setFilePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    dispatch(addPost(data.post))
  };

  const { mutate, isPending, register, handleSubmit, errors, reset } = useCreatePost(handleSuccess);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const newPreviews: FilePreview[] = [];
    
    console.log('📁 Selected files:', selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    for (const file of selectedFiles) {
      const validation = fileUploadService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
        const fileType = fileUploadService.getFileType(file);
        
        const filePreview: FilePreview = {
          file,
          type: fileType
        };
        
        try {
          if (fileType === 'image') {
            filePreview.preview = await fileUploadService.createImagePreview(file);
            console.log('🖼️ Created image preview for:', file.name);
          } else if (fileType === 'video') {
            filePreview.preview = await fileUploadService.createVideoPreview(file);
            console.log('🎥 Created video thumbnail for:', file.name);
          }
          // Documents don't need previews
        } catch (error) {
          console.error(`❌ Error creating preview for ${file.name}:`, error);
        }
        
        newPreviews.push(filePreview);
      } else {
        console.error(`❌ File ${file.name} is invalid:`, validation.error);
        alert(`File ${file.name} is invalid: ${validation.error}`);
      }
    }
    
    setFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      console.log('📦 Updated files array:', newFiles.map(f => f.name));
      return newFiles;
    });
    setFilePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    console.log('🗑️ Removing file at index:', index);
    // Clean up object URL to prevent memory leaks
    if (filePreviews[index]?.preview && filePreviews[index].preview?.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviews[index].preview!);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = (data: { content: string }) => {
    console.log('📝 Form submission started');
    console.log('📄 Form data:', data);
    console.log('📁 Files to upload:', files.map(f => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type 
    })));
    
    // Validate that we have content or files
    if (!data.content.trim() && files.length === 0) {
      alert('Post must have content or files');
      return;
    }
    
    // Pass data in the format expected by the backend
    const postData = {
      content: data.content,
      images: files // Backend expects 'images' key for all file types
    };
    
    console.log('🚀 Sending post data:', {
      content: postData.content,
      fileCount: postData.images?.length || 0,
      fileNames: postData.images?.map(f => f.name) || []
    });
    
    mutate(postData);
  };

  const renderFilePreview = (filePreview: FilePreview, index: number) => {
    const { file, preview, type } = filePreview;
    
    return (
      <div key={index} className="relative bg-gray-50 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => removeFile(index)}
          className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
        >
          <X size={16} />
        </button>
        
        {type === 'image' && preview && (
          <img 
            src={preview} 
            alt={`Preview ${index}`}
            className="w-full h-32 object-cover"
          />
        )}
        
        {type === 'video' && (
          <div className="relative">
            {preview ? (
              <img 
                src={preview} 
                alt={`Video thumbnail ${index}`}
                className="w-full h-32 object-cover"
              />
            ) : (
              <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                <Video size={32} className="text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-60 rounded-full p-2">
                <Play size={20} className="text-white ml-1" />
              </div>
            </div>
          </div>
        )}
        
        {type === 'document' && (
          <div className="w-full h-32 bg-gray-100 flex flex-col items-center justify-center p-4">
            <FileText size={32} className="text-gray-400 mb-2" />
            <span className="text-xs text-gray-600 text-center truncate w-full">
              {file.name}
            </span>
          </div>
        )}
        
        <div className="p-2 bg-white">
          <p className="text-xs font-medium truncate">{file.name}</p>
          <p className="text-xs text-gray-500">
            {fileUploadService.formatFileSize(file.size)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <textarea
          {...register('content')}
          placeholder="What's on your mind?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
        
        {/* Show validation errors */}
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
        )}
        
        {/* File previews */}
        {filePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filePreviews.map((filePreview, index) => renderFilePreview(filePreview, index))}
          </div>
        )}

        {/* File count indicator */}
        {files.length > 0 && (
          <div className="mt-3 text-sm text-gray-600">
            {files.length} file{files.length > 1 ? 's' : ''} selected
            <span className="ml-2 text-xs">
              ({files.filter(f => f.type.startsWith('image/')).length} images, 
               {files.filter(f => f.type.startsWith('video/')).length} videos, 
               {files.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('video/')).length} documents)
            </span>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Add files"
            >
              <Image size={20} />
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Add documents (supported)"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={20} />
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Posting...' : 'Post'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </form>
    </div>
  );
};