import { z } from "zod";
import {
  MutationResult,
  QueryResult,
  useApiController,
  UseApiControllerOptions,
} from "@/hooks/useFetch";
import { useDispatch, useSelector } from "react-redux";
import {
  addReels,
  addReel,
  addComment,
  toggleLike,
  setReelsWithPagination,
  setComments,
  toggleCommentLike,
  updateReel,
  updateComment,
  setUserReels,
  setUserLikedReels,
  setUserSavedReels,
  addSavedReel,
  setPagination,
  PaginationInfo,
  removeReel,
  selectComments,
  removeComment,
} from "@/libs/redux/reelsSlice";
import { AppDispatch, RootState } from "@/libs/redux/store";
import { IComment, Reel, ReactedUser } from "@/types";
import { errorMessageHandler } from "@/libs/feedback/error-handler";
import { useState } from "react";
import { store } from "@/libs/redux/store";

const createReelSchema = z.object({
  fileUrl: z.string(z.instanceof(File)),
  title: z.string().optional()
});

const editReelSchema = z.object({
  content: z.string().min(1, "Reel content is required").optional(),
  images: z.array(z.instanceof(File)).optional().default([]),
  existingImages: z.array(z.string()).optional().default([]),
  removedImages: z.array(z.string()).optional().default([]),
});

const commentSchema = z.object({
  content: z.string().min(1, "Comment is required"),
  file: z.union([z.instanceof(File), z.string()]).optional().or(z.literal("")),
  parentCommentId: z.string().optional(),
});

interface ReelsResponse {
  success: boolean;
  reels: Reel[];
  pagination: PaginationInfo;
}

interface CommentsResponse {
  success: boolean;
  comments: IComment[];
  pagination: PaginationInfo;
}

interface CreateReelData extends Record<string, any> {
  fileUrl: File;
  title?: string;
}

interface EditReelData extends Record<string, any> {
  content?: string;
  images?: File[];
  existingImages?: string[];
  removedImages?: string[];
}

interface CreateReelResponse {
  success: boolean;
  message: string;
  reel: Reel;
}

interface singleCommentResponse {
  comment: IComment
}

interface CommentPayload {
  content: string;
  file?: File | string;
  parentCommentId?: string;
}

interface CommentResponse {
  success: boolean;
  comment: IComment;
}

interface ReactResponse {
  success: boolean;
  reelId: string;
  commentId?: string;
  userId: string;
  reactions: ReactedUser[];
}

export const useGetReels = (
  initialPage: number = 1,
  options?: Partial<
    Omit<UseApiControllerOptions<Record<string, any>, ReelsResponse>, "method">
  >
): QueryResult<ReelsResponse> & { trigger: () => void } => {
  const dispatch: AppDispatch = useDispatch();
  const [page, setPage] = useState(initialPage);

  const result = useApiController<ReelsResponse>({
    method: "GET",
    url: `/reels?page=${page}&limit=20`,
    ...options,
    onSuccess: (data: ReelsResponse) => {
      if (page === 1) {
        dispatch(setReelsWithPagination(data));
      } else {
        dispatch(addReels(data.reels || []));
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

export const useGetSingleReel = (
  reelId: string,
  options?: Partial<
    Omit<UseApiControllerOptions<Record<string, any>, { success: boolean; reel: Reel }>, "method">
  >
) => {
  return useApiController({
    method: "GET",
    url: `/reels/${reelId}`,
    queryOptions: {
      enabled: !!reelId,
      staleTime: 5 * 60 * 1000,
    },
    ...options,
  });
};

export const useGetComments = (
  reelId: string,
  options?: Partial<UseApiControllerOptions<Record<string, any>, CommentsResponse>>
): QueryResult<CommentsResponse> & { loadMoreComments: () => void; refetchComments: () => void} => {
  const dispatch: AppDispatch = useDispatch();
  const [page, setPage] = useState(1);

    const existingComments = useSelector(selectComments(reelId));
  

  const result = useApiController<CommentsResponse>({
    method: "GET",
    url: `/reels/${reelId}/comments?page=${page}&limit=10`,
    queryOptions: {
      enabled: !!reelId,
      staleTime: 2 * 60 * 1000,
      ...options?.queryOptions,
    },
    onSuccess: (data: CommentsResponse) => {
      const updatedComments = page === 1 
              ? data.comments 
              : [...(existingComments || []), ...data.comments];
            
            dispatch(
              setComments({
                reelId,
                comments: updatedComments,
              })
            );
            dispatch(setPagination({ reelId, pagination: data.pagination }));
          },
  });

  const loadMoreComments = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

   const refetchComments = () => {
    setPage(1);
    result.refetch();
  };

  return { ...result, loadMoreComments, refetchComments };
};

export const useGetSingleReelComment = (
  reelId: string,
  commentId: string,
  options?: Partial<UseApiControllerOptions<Record<string, any>, singleCommentResponse>>
): QueryResult<singleCommentResponse> => {
  const dispatch: AppDispatch = useDispatch();

  const result = useApiController<singleCommentResponse>({
    method: "GET",
    url: `/reels/${reelId}/comments/${commentId}`,
    queryOptions: {
      enabled: !!reelId,
      staleTime: 2 * 60 * 1000,
      ...options?.queryOptions,
    },
  });

  return result
};

export const useCreateReel = (
  onSuccess?: (data: CreateReelResponse) => void,
  options?: Partial<UseApiControllerOptions<CreateReelData, CreateReelResponse>>
): MutationResult<CreateReelData, CreateReelResponse> => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController<CreateReelData, CreateReelResponse>({
    method: "POST",
    url: "/reels",
    schema: createReelSchema,
    successMessage: "Reel created successfully!",
    onSuccess: (data: CreateReelResponse) => {
      dispatch(addReel(data.reel));
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      errorMessageHandler(error);
    },
    ...options,
  } as any);
};

export const useUpdateReel = (
  reelId: string,
  options?: Partial<UseApiControllerOptions<EditReelData, CreateReelResponse>>
): MutationResult<EditReelData, CreateReelResponse> => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController<EditReelData, CreateReelResponse>({
    method: "PUT",
    url: `/reels/${reelId}`,
    schema: editReelSchema,
    successMessage: "Reel updated successfully!",
    onSuccess: (data: CreateReelResponse) => {
      dispatch(updateReel({ reel: data.reel, _id: data.reel._id }));
    },
    onError: (error: any) => {
      errorMessageHandler(error);
    },
    ...options,
  } as any);
};

export const useDeleteReel = (
  reelId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "DELETE",
    url: `/reels/${reelId}`,
    successMessage: "Reel deleted successfully!",
    onSuccess: () => {
      dispatch(removeReel(reelId));
    },
  });
};

export const useReactReel = (
  reelId: string,
  options?: Partial<
    UseApiControllerOptions<
      { isLiked?: boolean; emoji: string; name: string },
      ReactResponse
    >
  >
): MutationResult<{ isLiked?: boolean; emoji: string; name: string }, ReactResponse> => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController<{ isLiked?: boolean; emoji: string; name: string },
      ReactResponse>({
    method: "POST",
    url: `/reels/${reelId}/react`,
    onSuccess: (data: ReactResponse) => {
      dispatch(toggleLike({ reelId: data.reelId, userId: data.userId, reactions: data.reactions }));
    },
    ...options,
  }as any);
};

export const useAddReelComment = (
  reelId: string,
  onSuccess: (data: any) => void,
  options?: Partial<UseApiControllerOptions<CommentPayload, CommentResponse>>
): MutationResult<CommentPayload, CommentResponse> => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController<CommentPayload, CommentResponse>({
    method: "POST",
    url: `/reels/${reelId}/comment`,
    schema: commentSchema,
    successMessage: "Comment added successfully!",
    onSuccess: (data: CommentResponse) => {
      dispatch(addComment({ reelId: data.comment.dynamicId, comment: data.comment }));
      onSuccess(data)
    },
    onError: (error: any) => {
      errorMessageHandler(error || "Failed to add comment");
    },
    ...options,
  }as any);
};

export const useUpdateReelComment = (
  reelId: string,
  commentId: string,
  options?: Partial<UseApiControllerOptions<Partial<CommentPayload>, CommentResponse>>
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController<Partial<CommentPayload>, CommentResponse>({
    method: "PUT",
    url: `/reels/${reelId}/comment/${commentId}`,
    schema: commentSchema.partial(),
    successMessage: "Comment updated successfully!",
    onSuccess: (data: CommentResponse) => {
      dispatch(updateComment({ comment: data.comment, _id: data.comment._id, reelId }));
    },
    ...options,
  }as any);
};

export const useDeleteReelComment = (
  reelId: string,
  commentId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "DELETE",
    url: `/reels/${reelId}/comment/${commentId}`,
    successMessage: "Comment deleted successfully!",
    onSuccess: () => {
      dispatch(removeComment({ reelId, commentId }));
    },
  });
};

export const useReactReelComment = (
  reelId: string,
  commentId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "POST",
    url: `/reels/${reelId}/comment/${commentId}/react`,
    onSuccess: (data) => {
      dispatch(toggleCommentLike({ reelId, commentId, userId: data.userId, reactions: data.reactions }));
    },
  });
};

// export const useSearchReels = (
//   query: string,
// ) => {
//   const dispatch: AppDispatch = useDispatch();
//   return useApiController({
//     method: "GET",
//     url: `/reels/search/${query}`,
//     onSuccess: (data) => {
//       dispatch(setSearchResults({ reels: data.reels }));
//     },
//   });
// };

export const useGetTrendingReels = (
) => {
  return useApiController({
    method: "GET",
    url: "/reels/trending",
    queryOptions: {
      staleTime: 10 * 60 * 1000,
    },
  });
};

export const useGetBookmarkedReels = (
) => {
  return useApiController({
    method: "GET",
    url: "/reels/bookmarked",
    queryOptions: {
      staleTime: 5 * 60 * 1000,
    },
  });
};

export const useGetUserReels = (
  initialPage: number = 1,
  userId: string,
) => {
  const [page, setPage] = useState(initialPage)
  const dispatch: AppDispatch = useDispatch();
  const result =  useApiController({
    method: "GET",
    url: `/auth/${userId}/reels?page=${page}&limit=20`,
    queryOptions: {
      staleTime: 2 * 60 * 1000,
    },
    onSuccess: (data) => {
      dispatch(setUserReels(data.reels));
    },
  });

  const trigger = () => {
    if (!result.isLoading && result.data?.pagination.hasNextPage) {
      setPage((prevPage) => prevPage + 1);
    }
  };
  return {...result, trigger}
};

export const useGetLikedReels = (
  userId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "GET",
    url: `/auth/${userId}/liked-reels`,
    queryOptions: {
      staleTime: 2 * 60 * 1000,
    },
    onSuccess: (data) => {
      dispatch(setUserLikedReels(data.reels));
    },
  });
};

export const useGetSavedReels = (
  userId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "GET",
    url: `/auth/${userId}/saved-reels`,
    queryOptions: {
      staleTime: 2 * 60 * 1000,
    },
    onSuccess: (data) => {
      dispatch(setUserSavedReels(data.reels));
    },
  });
};

export const useSaveReel = (
  reelId: string,
) => {
  const dispatch: AppDispatch = useDispatch();
  return useApiController({
    method: "POST",
    url: `/reels/${reelId}/save`,
    onSuccess: (data) => {
      dispatch(addSavedReel(data.reel));
    },
    successMessage: "Reel saved successfully",
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