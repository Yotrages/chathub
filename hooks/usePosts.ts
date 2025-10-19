import { z } from "zod";
import {
  MutationResult,
  QueryResult,
  useApiController,
  UseApiControllerOptions,
} from "@/hooks/useFetch";
import { useDispatch, useSelector } from "react-redux";
import {
  addPosts,
  addPost,
  addComment,
  toggleLike,
  setPostsWithPagination,
  setComments,
  toggleCommentLike,
  updatePost,
  updateComment,
  setUserPosts,
  setUserLikedPosts,
  setUserSavedPosts,
  addSavedPost,
  setPagination,
  PaginationInfo,
  removePost,
  selectComments,
  removeComment,
  addUserPosts,
  addLikedPosts,
  addSavedPosts,
} from "@/libs/redux/postSlice";
import { AppDispatch } from "@/libs/redux/store";
import { IComment, Post, ReactedUser } from "@/types";
import { errorMessageHandler } from "@/libs/feedback/error-handler";
import { useState } from "react";
import { successNotification } from "@/libs/feedback/notification";
import { useRouter } from "next/navigation";

const createPostSchema = z.object({
  content: z.string().min(1, "Post content is required"),
  images: z.array(z.instanceof(File)).optional().default([]),
});

const editPostSchema = z.object({
  content: z.string().min(1, "Post content is required").optional(),
  images: z.array(z.instanceof(File)).optional().default([]),
  existingImages: z.array(z.string()).optional().default([]),
  removedImages: z.array(z.string()).optional().default([]),
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment is required"),
  file: z.union([z.instanceof(File), z.string()]).optional().or(z.literal("")),
  parentCommentId: z.string().optional(),
});

interface PostsResponse {
  success: boolean;
  posts: Post[];
  pagination: PaginationInfo;
}

interface CommentsResponse {
  success: boolean;
  comments: IComment[];
  pagination: PaginationInfo;
}

interface singleCommentResponse {
  comment: IComment
}

interface CreatePostData extends Record<string, any> {
  content: string;
  images?: File[];
  visibility?: string;
}

interface EditPostData extends Record<string, any> {
  content?: string;
  images?: File[];
  existingImages?: string[];
  removedImages?: string[];
}

interface CreatePostResponse {
  success: boolean;
  message: string;
  post: Post;
}

interface CommentPayload {
  content: string;
  file?: File | string;
  parentCommentId?: string;
}

interface CommentResponse {
  success: boolean;
  comment: any;
  message: string;
}

interface ReactResponse {
  success: boolean;
  postId: string;
  commentId?: string;
  userId: string;
  reactions: ReactedUser[];
}

export const useGetPosts = (
  initialPage: number = 1,
  options?: Partial<
    Omit<UseApiControllerOptions<Record<string, any>, PostsResponse>, "method">
  >
): QueryResult<PostsResponse> & { trigger: () => void } => {
  const dispatch: AppDispatch = useDispatch();
  const [page, setPage] = useState(initialPage);

  const result = useApiController<PostsResponse>({
    method: "GET",
    url: `/posts?page=${page}&limit=20`,
    ...options,
    onSuccess: (data: PostsResponse) => {
      if (page === 1) {
        dispatch(setPostsWithPagination(data));
      } else {
        dispatch(addPosts(data.posts || []));
      }
    },
    queryOptions: {
      staleTime: 5 * 60 * 1000,
      ...options?.queryOptions,
    },
  });

  const trigger = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return { ...result, trigger };
};

export const useGetSinglePost = (
  postId: string,
  options?: Partial<
    Omit<UseApiControllerOptions<Record<string, any>, { success: boolean; post: Post }>, "method">
  >
) => {
  return useApiController({
    method: "GET",
    url: `/posts/${postId}`,
    queryOptions: {
      enabled: !!postId,
      staleTime: 5 * 60 * 1000,
    },
    ...options,
  });
};

export const useGetComments = (
  postId: string,
  then?: () => void,
  catcher?: () => void,
  options?: Partial<UseApiControllerOptions<Record<string, any>, CommentsResponse>>,
): QueryResult<CommentsResponse> & { 
  loadMoreComments: () => void; 
  refetchComments: () => void;
  hasSuccessfullyFetched: boolean;
} => {
  const dispatch: AppDispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [hasSuccessfullyFetched, setHasSuccessfullyFetched] = useState(false);
  
  const existingComments = useSelector(selectComments(postId));
  
  const result = useApiController<CommentsResponse>({
    method: "GET",
    url: `/posts/${postId}/comments?page=${page}&limit=10`,
    queryOptions: {
      enabled: !!postId && navigator.onLine, 
      staleTime: 5 * 60 * 1000, 
      retry: (failureCount: number, error: any) => {
        return failureCount < 3 && navigator.onLine;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      ...options?.queryOptions,
    },
    onSuccess: (data: CommentsResponse) => {
      console.log(`Successfully fetched comments for postId ${postId}:`, data.comments);
      
      const updatedComments = page === 1 
        ? data.comments 
        : [...(existingComments || []), ...data.comments];
      
      dispatch(
        setComments({
          postId,
          comments: updatedComments,
        })
      );
      dispatch(setPagination({ postId, pagination: data.pagination }));
      setHasSuccessfullyFetched(true);
      if (then) then();
    },
    onError: (error: any) => {
      console.error(`Failed to fetch comments for postId ${postId}:`, error);
      setHasSuccessfullyFetched(false);
      if (catcher) catcher();
    },
    ...options,
  } as any);

  const loadMoreComments = () => {
    if (!navigator.onLine) {
      console.log('Cannot load more comments - user is offline');
      return;
    }
    
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
      console.log(`Loading more comments for postId ${postId}, page ${page + 1}`);
      setPage((prev) => prev + 1);
    }
  };

  const refetchComments = () => {
    if (!navigator.onLine) {
      console.log('Cannot refetch comments - user is offline');
      return;
    }
    
    console.log(`Refetching comments for postId ${postId}`);
    setPage(1);
    setHasSuccessfullyFetched(false);
    result.refetch();
  };

  return { ...result, loadMoreComments, refetchComments, hasSuccessfullyFetched };
};


export const useGetSingleComment = (
  postId: string,
  commentId: string,
  options?: Partial<UseApiControllerOptions<Record<string, any>, singleCommentResponse>>
): QueryResult<singleCommentResponse> => {
  const dispatch: AppDispatch = useDispatch();

  const result = useApiController<singleCommentResponse>({
    method: "GET",
    url: `/posts/${postId}/comments/${commentId}`,
    queryOptions: {
      enabled: !!postId,
      staleTime: 2 * 60 * 1000,
      ...options?.queryOptions,
    },
  });

  return result
};

export const useCreatePost = (
  onSuccess?: (data: CreatePostResponse) => void,
  options?: Partial<UseApiControllerOptions<CreatePostData, CreatePostResponse>>
): MutationResult<CreatePostData, CreatePostResponse> => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController<CreatePostData, CreatePostResponse>({
    method: "POST",
    url: "/posts",
    schema: createPostSchema,
    successMessage: "Post created successfully!",
    onSuccess: (data: CreatePostResponse) => {
      dispatch(addPost(data.post));
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      errorMessageHandler(error);
    },
    ...options,
  } as any);
};

export const useUpdatePost = (
  postId: string,
  options?: Partial<UseApiControllerOptions<EditPostData, CreatePostResponse>>
): MutationResult<EditPostData, CreatePostResponse> => {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter()
  return useApiController<EditPostData, CreatePostResponse>({
    method: "PUT",
    url: `/posts/${postId}`,
    schema: editPostSchema,
    successMessage: "Post updated successfully!",
    onSuccess: (data: CreatePostResponse) => {
      dispatch(updatePost({ post: data.post, _id: data.post._id }));
      if (window.location.pathname.includes('edit')) {
        router.back()
      }
    },
    onError: (error: any) => {
      errorMessageHandler(error);
    },
    ...options,
  } as any);
};

export const useDeletePost = (
  postId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "DELETE",
    url: `/posts/${postId}`,
    successMessage: "Post deleted successfully!",
    onSuccess: () => {
      dispatch(removePost(postId));
    },
  });
};

export const useLikePost = (
  postId: string,
  options?: Partial<
    UseApiControllerOptions<
      { isLiked: boolean; emoji: string; name: string },
      ReactResponse
    >
  >
): MutationResult<{ isLiked: boolean; emoji: string; name: string }, ReactResponse> => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController<{ isLiked: boolean; emoji: string; name: string },
      ReactResponse>({
    method: "POST",
    url: `/posts/${postId}/react`,
    onSuccess: (data: ReactResponse) => {
      dispatch(toggleLike({ postId: data.postId, userId: data.userId, reactions: data.reactions }));
    },
    ...options,
  }as any);
};

export const useAddComment = (
  postId: string,
  onSuccess: (data: CommentResponse) => void,
  options?: Partial<UseApiControllerOptions<CommentPayload, CommentResponse>>
): MutationResult<CommentPayload, CommentResponse> => {
  const dispatch: AppDispatch = useDispatch();
  const { refetchComments } = useGetComments(postId); 

  return useApiController<CommentPayload, CommentResponse>({
    method: "POST",
    url: `/posts/${postId}/comment`,
    schema: commentSchema,
    onSuccess: (data: CommentResponse) => {
      console.log(`Adding comment for postId ${postId}:`, data.comment); 
      dispatch(addComment({ postId, comment: { ...data.comment, dynamicId: postId } }));
      refetchComments(); 
      onSuccess(data);
      successNotification(data.message);
    },
    onError: (error: any) => {
      console.error(`Failed to add comment for postId ${postId}:`, error); // Debug log
      errorMessageHandler(error);
    },
    ...options,
  } as any);
};


export const useUpdateComment = (
  postId: string,
  commentId: string,
  onSuccess: (data: CommentResponse) => void,
  options?: Partial<UseApiControllerOptions<Partial<CommentPayload>, CommentResponse>>
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController<Partial<CommentPayload>, CommentResponse>({
    method: "PUT",
    url: `/posts/${postId}/comment/${commentId}`,
    schema: commentSchema.partial(),
    successMessage: "Comment updated successfully!",
    onSuccess: (data: CommentResponse) => {
      dispatch(updateComment({ comment: data.comment, _id: data.comment._id, postId }));
      onSuccess(data)
    },
    ...options,
  }as any);
};

export const useDeleteComment = (
  postId: string,
  commentId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "DELETE",
    url: `/posts/${postId}/comment/${commentId}`,
    successMessage: "Comment deleted successfully!",
    onSuccess: () => {
      dispatch(removeComment({ postId, commentId }));
    },
  });
};

export const useLikeComment = (
  postId: string,
  commentId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "POST",
    url: `/posts/${postId}/comment/${commentId}/react`,
    onSuccess: (data) => {
      dispatch(toggleCommentLike({ postId, commentId, userId: data.userId, reactions: data.reactions }));
    },
  });
};

// export const useSearchPosts = (
//   query: string,
// ) => {
//   const dispatch: AppDispatch = useDispatch();
//   return useApiController({
//     method: "GET",
//     url: `/posts/search/${query}`,
//     onSuccess: (data) => {
//       dispatch(setSearchResults({ posts: data.posts }));
//     },
//   });
// };

export const useGetTrendingPosts = (
) => {
  return useApiController({
    method: "GET",
    url: "/posts/trending",
    queryOptions: {
      staleTime: 10 * 60 * 1000,
    },
  });
};

export const useGetBookmarkedPosts = (
) => {
  return useApiController({
    method: "GET",
    url: "/posts/bookmarked",
    queryOptions: {
      staleTime: 5 * 60 * 1000,
    },
  });
};

export const useGetUserPosts = (
  initialPage: number = 1,
  userId: string,
) => {
  const [page, setPage] = useState(initialPage)
  const dispatch: AppDispatch = useDispatch();
  const result =  useApiController({
    method: "GET",
    url: `/auth/${userId}/posts?page=${page}&limit=20`,
    queryOptions: {
      staleTime: 2 * 60 * 1000,
    },
    onSuccess: (data) => {
      if (page === 1) {
        dispatch(setUserPosts(data));
      } else {
        dispatch(addUserPosts(data.posts || []))
      }
    },
  });

  const trigger = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
      setPage((prevPage) => prevPage + 1);
    }
  };
  return { ...result, trigger}
};

export const useGetLikedPosts = (
  initialPage: number = 1,
    userId: string,
) => {
    const [page, setPage] = useState(initialPage)

  const dispatch: AppDispatch = useDispatch();
  const result = useApiController({
    method: "GET",
    url: `/auth/${userId}/liked-posts?page=${page}&limit=20`,
    queryOptions: {
      staleTime: 2 * 60 * 1000,
    },
    onSuccess: (data) => {
    if (page === 1) {
        dispatch(setUserLikedPosts(data));
      } else {
        dispatch(addLikedPosts(data.posts || []))
      }    },
  });
  
  const trigger = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return {...result, trigger}
};

export const useGetSavedPosts = (
  initialPage: number = 1,
  userId: string,
  sort: string = "latest"
) => {
  const dispatch: AppDispatch = useDispatch();
  const [page, setPage] = useState(initialPage)
 const result = useApiController({
    method: "GET",
    url: `/auth/${userId}/saved-posts?page=${page}&limit=20&sort=${sort}`,
    queryOptions: {
      staleTime: 2 * 60 * 1000,
    },
    onSuccess: (data) => {
      if (page === 1) {
        dispatch(setUserSavedPosts(data));
      } else {
        dispatch(addSavedPosts(data.posts || []))
      }
    },
  });

  const trigger = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return {...result, trigger}
};

export const useSavePost = (
  postId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "POST",
    url: `/posts/${postId}/save`,
    onSuccess: (data) => {
      dispatch(addSavedPost(data.post));
    },
    successMessage: "Post saved successfully",
  });
};

export const useBlockPost = (
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "POST",
    url: `/settings/block-post`,
    onSuccess: (data) => {
      dispatch(removePost(data.postId));
    },
    successMessage: "Post blocked successfully",
  });
};

export const fileUploadService = {
  validateFile: (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024;
    const maxImageSize = 10 * 1024 * 1024;

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
    ];

    const allowedDocumentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const allowedAudioTypes = ["audio/mp3", "audio/mpeg"];

    const allAllowedTypes = [
      ...allowedImageTypes,
      ...allowedVideoTypes,
      ...allowedDocumentTypes,
      ...allowedAudioTypes,
    ];

    if (!allAllowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "File type not supported. Please upload images, videos, or documents.",
      };
    }

    if (allowedImageTypes.includes(file.type) && file.size > maxImageSize) {
      return {
        isValid: false,
        error: "Image size must be less than 10MB",
      };
    }

    if (allowedVideoTypes.includes(file.type) && file.size > maxSize) {
      return {
        isValid: false,
        error: "Video size must be less than 50MB",
      };
    }

    if (allowedDocumentTypes.includes(file.type) && file.size > maxImageSize) {
      return {
        isValid: false,
        error: "Document size must be less than 10MB",
      };
    }

    return { isValid: true };
  },

  getFileType: (file: File): "image" | "video" | "document" | "audio" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "document";
  },

  createImagePreview: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to create preview"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  createAudioPreview: (file: File): Promise<string> => {
    return new Promise((resolve) => {
      resolve(URL.createObjectURL(file));
    });
  },

  createVideoPreview: (file: File): Promise<string> => {
    return new Promise((resolve) => {
      resolve(URL.createObjectURL(file));
    });
  },

  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  getFileIcon: (fileType: string): string => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType === "application/pdf") return "📄";
    if (fileType.includes("word")) return "📝";
    return "📎";
  },
};