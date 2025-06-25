import { z } from "zod";
import { MutationResult, QueryResult, useApiController, UseApiControllerOptions } from "@/hooks/useFetch";
import { useDispatch } from "react-redux";
import {  addPosts, addPost, addComment, toggleLike, setPostsWithPagination, PostsResponse, addReply, toggleCommentLike, removeReply, toggleReplyLike, setSearchResults, updatePost, updateComment, updateReply } from "@/libs/redux/postSlice";
import { AppDispatch } from "@/libs/redux/store";

// Validation schemas
const createPostSchema = z.object({
  content: z.string().min(1, "Post content is required"),
  images: z.array(z.instanceof(File)).optional().default([])
});


const commentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(500, "Comment too long"),
});
const ReplySchema = z.object({
  content: z.string().min(1, "Comment is required").max(500, "Comment too long"),
});

// Get posts feed
export const useGetPosts = (page: number = 1, options?: Partial<Omit<UseApiControllerOptions<Record<string, any>, PostsResponse>, 'method'>>): QueryResult<PostsResponse> => {  
const dispatch: AppDispatch = useDispatch()
  const result = useApiController<PostsResponse>({
    method: "GET",
    url: `posts/?page=${page}&limit=15`,
    ...options,
    onSuccess: (data: PostsResponse) => {
      console.log('API Response:', data); // This will now work
      if (page === 1) {
        dispatch(setPostsWithPagination({
          success: data.success,
          posts: data.posts || [],
          pagination: data.pagination
        }));
      } else {
        dispatch(addPosts(data.posts || []));
      }
    },
    queryOptions: {
      staleTime: 5 * 60 * 1000,
      ...options?.queryOptions,
    },
  } as UseApiControllerOptions<Record<string, any>, PostsResponse> & { method: "GET" });

  return result;
};

// Get user posts
export const useGetUserPosts = (userId?: string) => {
  return useApiController({
    method: "GET",
    url: `posts/user/${userId}/`,
    queryOptions: {
      enabled: !!userId || true,
      staleTime: 5 * 60 * 1000,
    }
  });
};

// Post creation types - matching your backend
interface CreatePostData extends Record<string, any> {
  content: string;
  images?: File[]; // Array of File objects
}

interface CreatePostResponse {
  success: boolean;
  message: string;
  post: {
    _id: string;
    content: string;
    authorId: {
      _id: string;
      username: string;
      avatar?: string;
      email: string;
    };
    images: string[]; 
    likes: any[];
    comments: any[];
    createdAt: string;
    updatedAt: string;
  };
}

// Create Post Hook
export const useCreatePost = (
  onSuccess?: (data: CreatePostResponse) => void,
  options?: Partial<any>
): MutationResult<CreatePostData, CreatePostResponse> => {
  const createPostSchema = z.object({
    content: z.string().min(1, "Post content is required").max(500, "Post content is too long"),
    images: z.array(z.instanceof(File)).max(5, "Maximum 5 images allowed").optional(),
  });

  return useApiController<CreatePostData, CreatePostResponse>({
    method: "POST",
    url: "posts", // Adjust to your API endpoint
    schema: createPostSchema,
    successMessage: "Post created successfully!",
    onSuccess: (data: any) => {
      console.log('✅ Post created successfully:', data);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error('❌ Failed to create post:', error);
    },
    ...options,
  } as any);
};

// File upload service
// services/fileUploadService.ts
export const fileUploadService = {
  validateFile: (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB for videos, 10MB for images
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    
    const allowedImageTypes = [
      'image/jpeg', 
      'image/png', 
      'image/jpg', 
      'image/gif', 
      'image/webp', 
      'image/svg+xml'
    ];
    
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime', // .mov files
      'video/x-msvideo', // .avi files
      'video/x-ms-wmv'   // .wmv files
    ];
    
    const allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocumentTypes];
    
    if (!allAllowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload images, videos, or documents.'
      };
    }
    
    // Different size limits for different file types
    if (allowedImageTypes.includes(file.type) && file.size > maxImageSize) {
      return {
        isValid: false,
        error: 'Image size must be less than 10MB'
      };
    }
    
    if (allowedVideoTypes.includes(file.type) && file.size > maxSize) {
      return {
        isValid: false,
        error: 'Video size must be less than 50MB'
      };
    }
    
    if (allowedDocumentTypes.includes(file.type) && file.size > maxImageSize) {
      return {
        isValid: false,
        error: 'Document size must be less than 10MB'
      };
    }
    
    return { isValid: true };
  },
  
  getFileType: (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  },
  
  createImagePreview: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to create preview'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },
  
  createVideoPreview: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Seek to 1 second for thumbnail
      };
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg');
        resolve(dataURL);
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video'));
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(file);
    });
  },
  
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  getFileIcon: (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    return '📎';
  }
};
// Update post
export const useUpdatePost = (postId: string) => {
const dispatch: AppDispatch = useDispatch()
  return useApiController({
    method: "PUT",
    url: `posts/${postId}`,
    schema: createPostSchema.partial(),
    successMessage: "Post updated successfully!",
    onSuccess: (data: any) => {
      dispatch(updatePost({
        post: data.post,
        _id: data._id
      }))
    }
  });
};

// Delete post
export const useDeletePost = (postId: string) => {
  return useApiController({
    method: "DELETE",
    url: `/posts/${postId}`,
    successMessage: "Post deleted successfully!",
  });
};

// Like/Unlike post
interface LikePostResponse {
  postId: string;
  userId: string;
  isLiked: boolean;
  likes: Array<{
    _id: string;
    username?: string;
    avatar?: string;
  }>;
}

export const useLikePost = (postId: string, options?: Partial<Omit<UseApiControllerOptions<{ isLiked: boolean }, LikePostResponse>, 'method'>>): MutationResult<{ isLiked: boolean }, LikePostResponse> => {
  const dispatch: AppDispatch = useDispatch();
  
  return useApiController<{ isLiked: boolean }, LikePostResponse>({
    method: "POST",
    url: `posts/${postId}/like`,
    onSuccess: (data) => {
      dispatch(toggleLike({
        postId: data.postId,
        userId: data.userId,
        likes: data.likes
      }));
    },
    ...options
  } as UseApiControllerOptions<{ isLiked: boolean }, LikePostResponse> & { method: "POST" });
};

// Bookmark/Unbookmark post
// export const useBookmarkPost = () => {
//   const dispatch: AppDispatch = useDispatch();
  
//   return useApiController({
//     method: "POST",
//     url: "posts/bookmark/",
//     onSuccess: (data: any) => {
//       dispatch(toggleBookmark({
//         postId: data.postId,
//         isBookmarked: data.isBookmarked
//       }));
//     },
//   });
// };

// Share post
// export const useSharePost = () => {
//   const dispatch: AppDispatch = useDispatch();
  
//   return useApiController({
//     method: "POST",
//     url: "posts/share/",
//     successMessage: "Post shared successfully!",
//     onSuccess: (data: any) => {
//       dispatch(incrementShares(data.postId));
//     },
//   });
// };

// Get post comments
export const useGetComments = (postId: string) => {
  return useApiController({
    method: "GET",
    url: `posts/${postId}/comments/`,
    queryOptions: {
      enabled: !!postId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  });
};

// Add comment
export const useAddComment = (postId: string) => {
    const dispatch: AppDispatch = useDispatch();

  return useApiController({
    method: "POST",
    url: `/posts/${postId}/comment`,
    schema: commentSchema,
    successMessage: "Comment added successfully!",
    onSuccess: (data: any) => {
      dispatch(addComment({
        postId: data.postId,
        comment: data.comment
      }))
    }
  });
};

export const useAddReply = (postId: string, commentId: string) => {
    const dispatch: AppDispatch = useDispatch();

  return useApiController({
    method: "POST",
    url: `/posts/${postId}/comment/${commentId}/reply`,
    schema: ReplySchema,
    successMessage: "Reply added successfully!",
    onSuccess: (data: any) => {
      dispatch(addReply({
        postId: data.postId,
        commentId: data.commentId,
        reply: data.reply,
      }))
    }
  });
};

export const useDeleteReply = (postId: string, commentId: string, replyId: string) => {
    const dispatch: AppDispatch = useDispatch();

  return useApiController({
    method: "DELETE",
    url: `/posts/${postId}/comment/${commentId}/reply/${replyId}`,
    successMessage: "Reply added successfully!",
    onSuccess: (data: any) => {
      dispatch(removeReply({
        postId: data.postId,
        commentId: data.commentId,
        replyId: data.replyId
      }))
    }
  });
};


export const useAddNestedReply = (postId: string, commentId: string, parentReplyId?: string) => {
    const dispatch: AppDispatch = useDispatch();

  return useApiController({
    method: "POST",
    url: `/posts/${postId}/comment/${commentId}/reply/${parentReplyId}`,
    schema: ReplySchema,
    successMessage: "Reply added successfully!",
    onSuccess: (data: any) => {
      dispatch(addReply({
        postId: data.postId,
        commentId: data.commentId,
        reply: data.reply,
        parentReplyId: data.parentReplyId
      }))
    }
  });
};

// Update comment
export const useUpdateComment = (postId: string, commentId: string) => {
const dispatch: AppDispatch = useDispatch()
  return useApiController({
    method: "PUT",
    url: `/posts/${postId}/comment/${commentId}`,
    schema: commentSchema.partial(),
    successMessage: "Comment updated successfully!",
    onSuccess: (data: any) => {
      dispatch(updateComment({
        comment: data.comment,
        _id: data._id,
        postId: data.postId
      }))
    }
  });
};

export const useUpdateReply = (postId: string, commentId: string) => {
const dispatch: AppDispatch = useDispatch()
  return useApiController({
    method: "PUT",
    url: `/posts/${postId}/comment/${commentId}`,
    schema: commentSchema.partial(),
    successMessage: "Comment updated successfully!",
    onSuccess: (data: any) => {
      dispatch(updateReply({
        commentId: data.commentId,
        postId: data.PostId,
        replyId: data.replyId,
        updates: data.updates
      }))
    }
  });
};

// Delete comment
export const useDeleteComment = (postId: string, commentId: string) => {
  return useApiController({
    method: "DELETE",
    url: `/posts/${postId}/comment/${commentId}`,
    successMessage: "Comment deleted successfully!",
  });
};

// Like comment
export const useLikeComment = (postId: string, commentId: string) => {
  const dispatch: AppDispatch = useDispatch()
  return useApiController({
    method: "POST",
    url: `/posts/${postId}/comment/${commentId}`,
    onSuccess: (data: any) => {
      dispatch(toggleCommentLike({
        postId: data.postId,
        commentId: data.commentId,
        userId: data.userId,
        likes: data.likes
      }))
    }
  });
};

export const useLikeReply = (postId: string, commentId: string, replyId: string) => {
  const dispatch: AppDispatch = useDispatch()
  return useApiController({
    method: "POST",
    url: `/posts/${postId}/comment/${commentId}/reply/like/${replyId}`,
    onSuccess: (data: any) => {
      dispatch(toggleReplyLike({
        postId: data.postId,
        commentId: data.commentId,
        userId: data.userId,
        replyId: data.replyId,
        likes: data.likes
      }))
    }
  });
};

// Search posts
export const useSearchPosts = (query: string) => {
  const dispatch: AppDispatch = useDispatch()
  return useApiController({
    method: "GET",
    url:`posts/search/${query}`,
    onSuccess: (data: any) => {
      dispatch(setSearchResults({
        posts: data.posts
      }))
    }
  });
};

// Get trending posts
export const useGetTrendingPosts = () => {
  return useApiController({
    method: "GET",
    url: "posts/trending/",
    queryOptions: {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  });
};

// Get bookmarked posts
export const useGetBookmarkedPosts = () => {
  return useApiController({
    method: "GET",
    url: "posts/bookmarked/",
    queryOptions: {
      staleTime: 5 * 60 * 1000,
    }
  });
};