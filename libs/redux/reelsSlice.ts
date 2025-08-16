import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IComment, Reel } from '@/types';

export interface CreateReel {
  content: string;
  images?: File[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number; // Changed to totalItems for flexibility (reels or comments)
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ReelsResponse {
  success: boolean;
  reels: Reel[];
  pagination: PaginationInfo;
}

export interface CommentsResponse {
  success: boolean;
  comments: IComment[];
  pagination: PaginationInfo;
}

export interface ReactedUser {
  userId: {
    _id: string;
    username: string;
    avatar: string;
  };
  emoji: {
    category: string;
    name: string;
  };
}

interface ReelsState {
  reels: Reel[];
  userReels: Reel[];
  likedReels: Reel[];
  savedReels: Reel[];
  comments: { [reelId: string]: IComment[] };
  isLoading: boolean;
  isCreating: boolean;
  pagination: PaginationInfo | null;
  searchResults: Reel[];
  isSearching: boolean;
  selectedReel: Reel | null;
  paginationType: "reels" | "user_reels" | "liked_reels" | "saved_reels"
}

const initialState: ReelsState = {
  reels: [],
  userReels: [],
  likedReels: [],
  savedReels: [],
  comments: {},
  isLoading: false,
  isCreating: false,
  pagination: null,
  searchResults: [],
  isSearching: false,
  selectedReel: null,
  paginationType: "reels"
};

const reelsSlice = createSlice({
  name: 'reel',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload;
    },

    setReelsWithPagination: (state, action: PayloadAction<ReelsResponse>) => {
      state.reels = action.payload.reels;
      state.pagination = action.payload.pagination;
    },

    setReels: (state, action: PayloadAction<Reel[]>) => {
      state.reels = action.payload;
    },

    addReels: (state, action: PayloadAction<Reel[]>) => {
      const newReels = action.payload.filter(
        newReel => !state.reels.some(existingReel => existingReel._id === newReel._id)
      );
      state.reels.push(...newReels);
    },
    addUserReels: (state, action: PayloadAction<Reel[]>) => {
      const newReels = action.payload.filter(
        newReel => !state.userReels.some(existingReel => existingReel._id === newReel._id)
      );
      state.userReels.push(...newReels);
    },
    addLikedReels: (state, action: PayloadAction<Reel[]>) => {
      const newReels = action.payload.filter(
        newReel => !state.likedReels.some(existingReel => existingReel._id === newReel._id)
      );
      state.likedReels.push(...newReels);
    },
    addSavedReels: (state, action: PayloadAction<Reel[]>) => {
      const newReels = action.payload.filter(
        newReel => !state.savedReels.some(existingReel => existingReel._id === newReel._id)
      );
      state.savedReels.push(...newReels);
    },

    addReel: (state, action: PayloadAction<Reel>) => {
      const exists = state.reels.find(p => p._id === action.payload._id);
      if (!exists) {
        state.reels.unshift(action.payload);
      }
    },

    addUserReel: (state, action: PayloadAction<Reel>) => {
      const exists = state.userReels.find(p => p._id === action.payload._id);
      if (!exists) {
        state.userReels.unshift(action.payload);
      }
    },

    addSavedReel: (state, action: PayloadAction<Reel>) => {
      const exists = state.savedReels.find(p => p._id === action.payload._id);
      if (!exists) {
        state.savedReels.unshift(action.payload);
      }
    },

    addLikedReel: (state, action: PayloadAction<Reel>) => {
      const exists = state.likedReels.find(p => p._id === action.payload._id);
      if (!exists) {
        state.likedReels.unshift(action.payload);
      }
    },

    updateReel: (state, action: PayloadAction<{ reel: Partial<Reel>, _id: string }>) => {
      const index = state.reels.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.reels[index] = { ...state.reels[index], ...action.payload.reel };
      }

      const userIndex = state.userReels.findIndex(p => p._id === action.payload._id);
      if (userIndex !== -1) {
        state.userReels[userIndex] = { ...state.userReels[userIndex], ...action.payload.reel };
      }

      const likedReelsIndex = state.likedReels.findIndex(p => p._id === action.payload._id);
      if (likedReelsIndex !== -1) {
        state.likedReels[likedReelsIndex] = { ...state.likedReels[likedReelsIndex], ...action.payload.reel };
      }

      const savedReelsIndex = state.savedReels.findIndex(p => p._id === action.payload._id);
      if (savedReelsIndex !== -1) {
        state.savedReels[savedReelsIndex] = { ...state.savedReels[savedReelsIndex], ...action.payload.reel };
      }
    },

    removeReel: (state, action: PayloadAction<string>) => {
      state.reels = state.reels.filter(p => p._id !== action.payload);
      state.userReels = state.userReels.filter(p => p._id !== action.payload);
      state.likedReels = state.likedReels.filter(p => p._id !== action.payload);
      state.savedReels = state.savedReels.filter(p => p._id !== action.payload);
      delete state.comments[action.payload];
    },

    setUserReels: (state, action: PayloadAction<ReelsResponse>) => {
      state.userReels = action.payload.reels;
      state.pagination = action.payload.pagination;
      state.paginationType = "user_reels"
    },

    setUserLikedReels: (state, action: PayloadAction<ReelsResponse>) => {
      state.likedReels = action.payload.reels;
      state.pagination = action.payload.pagination;
      state.paginationType = "liked_reels"
    },

    setUserSavedReels: (state, action: PayloadAction<ReelsResponse>) => {
      state.savedReels = action.payload.reels;
      state.pagination = action.payload.pagination;
      state.paginationType = "saved_reels"
    },

    toggleLike: (state, action: PayloadAction<{ reelId: string; userId: string; reactions: ReactedUser[] }>) => {
      const { reelId, reactions } = action.payload;
      const reelIndex = state.reels.findIndex(p => p._id === reelId);
      if (reelIndex !== -1) {
        state.reels[reelIndex].reactions = reactions;
      }

      const userReelIndex = state.userReels.findIndex(p => p._id === reelId);
      if (userReelIndex !== -1) {
        state.userReels[userReelIndex].reactions = reactions;
      }

      const likedReelIndex = state.likedReels.findIndex(p => p._id === reelId);
      if (likedReelIndex !== -1) {
        state.likedReels[likedReelIndex].reactions = reactions;
      }
    },

    setComments: (state, action: PayloadAction<{ reelId: string; comments: IComment[] }>) => {
      state.comments[action.payload.reelId] = action.payload.comments;
    },

    addComment: (state, action: PayloadAction<{ reelId: string; comment: IComment }>) => {
      const { reelId, comment } = action.payload;

      if (!state.comments[reelId]) {
        state.comments[reelId] = [];
      }

      if (comment.parentCommentId) {
        // Add as a reply to an existing comment
        const parentComment = state.comments[reelId].find(c => c._id === comment.parentCommentId);
        if (parentComment) {
          parentComment.replies = parentComment.replies ? [comment, ...parentComment.replies] : [comment];
          parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
        }
      } else {
        // Add as a top-level comment
        state.comments[reelId].unshift(comment);
      }

      // Update reel's comments array
      const reelIndex = state.reels.findIndex(p => p._id === reelId);
      if (reelIndex !== -1) {
        if (comment.parentCommentId) {
          const parentCommentIndex = state.reels[reelIndex].comments.findIndex(c => c._id === comment.parentCommentId);
          if (parentCommentIndex !== -1) {
            state.reels[reelIndex].comments[parentCommentIndex].replies = state.reels[reelIndex].comments[parentCommentIndex].replies
              ? [comment, ...state.reels[reelIndex].comments[parentCommentIndex].replies]
              : [comment];
            state.reels[reelIndex].comments[parentCommentIndex].repliesCount = (state.reels[reelIndex].comments[parentCommentIndex].repliesCount || 0) + 1;
          }
        } else {
          state.reels[reelIndex].comments.unshift(comment);
        }
      }

      const userReelIndex = state.userReels.findIndex(p => p._id === reelId);
      if (userReelIndex !== -1) {
        if (comment.parentCommentId) {
          const parentCommentIndex = state.userReels[userReelIndex].comments.findIndex(c => c._id === comment.parentCommentId);
          if (parentCommentIndex !== -1) {
            state.userReels[userReelIndex].comments[parentCommentIndex].replies = state.userReels[userReelIndex].comments[parentCommentIndex].replies
              ? [comment, ...state.userReels[userReelIndex].comments[parentCommentIndex].replies]
              : [comment];
            state.userReels[userReelIndex].comments[parentCommentIndex].repliesCount = (state.userReels[userReelIndex].comments[parentCommentIndex].repliesCount || 0) + 1;
          }
        } else {
          state.userReels[userReelIndex].comments.unshift(comment);
        }
      }
    },

    updateComment: (state, action: PayloadAction<{ comment: Partial<IComment>, _id: string; reelId: string }>) => {
      const { reelId, _id, comment } = action.payload;
      const comments = state.comments[reelId];

      if (comments) {
        const commentIndex = comments.findIndex(c => c._id === _id);
        if (commentIndex !== -1) {
          state.comments[reelId][commentIndex] = { ...comments[commentIndex], ...comment };
        } else {
          // Check if it's a reply
          for (const parentComment of comments) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex(r => r._id === _id);
              if (replyIndex !== -1) {
                parentComment.replies[replyIndex] = { ...parentComment.replies[replyIndex], ...comment };
                break;
              }
            }
          }
        }
      }

      const reelIndex = state.reels.findIndex(p => p._id === reelId);
      if (reelIndex !== -1) {
        const commentIndex = state.reels[reelIndex].comments.findIndex(c => c._id === _id);
        if (commentIndex !== -1) {
          state.reels[reelIndex].comments[commentIndex] = { ...state.reels[reelIndex].comments[commentIndex], ...comment };
        } else {
          for (const parentComment of state.reels[reelIndex].comments) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex(r => r._id === _id);
              if (replyIndex !== -1) {
                parentComment.replies[replyIndex] = { ...parentComment.replies[replyIndex], ...comment };
                break;
              }
            }
          }
        }
      }
    },

    removeComment: (state, action: PayloadAction<{ reelId: string; commentId: string }>) => {
      const { reelId, commentId } = action.payload;

      if (state.comments[reelId]) {
        const commentIndex = state.comments[reelId].findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          state.comments[reelId].splice(commentIndex, 1);
        } else {
          for (const parentComment of state.comments[reelId]) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex(r => r._id === commentId);
              if (replyIndex !== -1) {
                parentComment.replies.splice(replyIndex, 1);
                parentComment.repliesCount = (parentComment.repliesCount || 1) - 1;
                break;
              }
            }
          }
        }
      }

      const reelIndex = state.reels.findIndex(p => p._id === reelId);
      if (reelIndex !== -1) {
        const commentIndex = state.reels[reelIndex].comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          state.reels[reelIndex].comments.splice(commentIndex, 1);
        } else {
          for (const parentComment of state.reels[reelIndex].comments) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex(r => r._id === commentId);
              if (replyIndex !== -1) {
                parentComment.replies.splice(replyIndex, 1);
                parentComment.repliesCount = (parentComment.repliesCount || 1) - 1;
                break;
              }
            }
          }
        }
      }

      const userReelIndex = state.userReels.findIndex(p => p._id === reelId);
      if (userReelIndex !== -1) {
        const commentIndex = state.userReels[userReelIndex].comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          state.userReels[userReelIndex].comments.splice(commentIndex, 1);
        } else {
          for (const parentComment of state.userReels[userReelIndex].comments) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex(r => r._id === commentId);
              if (replyIndex !== -1) {
                parentComment.replies.splice(replyIndex, 1);
                parentComment.repliesCount = (parentComment.repliesCount || 1) - 1;
                break;
              }
            }
          }
        }
      }
    },

    toggleCommentLike: (state, action: PayloadAction<{ reelId: string; commentId: string; userId: string; reactions: ReactedUser[] }>) => {
      const { reelId, commentId, reactions } = action.payload;

      if (state.comments[reelId]) {
        const commentIndex = state.comments[reelId].findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          state.comments[reelId][commentIndex].reactions = reactions;
        } else {
          for (const parentComment of state.comments[reelId]) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex(r => r._id === commentId);
              if (replyIndex !== -1) {
                parentComment.replies[replyIndex].reactions = reactions;
                break;
              }
            }
          }
        }
      }

      const reelIndex = state.reels.findIndex(p => p._id === reelId);
      if (reelIndex !== -1) {
        const commentIndex = state.reels[reelIndex].comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          state.reels[reelIndex].comments[commentIndex].reactions = reactions;
        } else {
          for (const parentComment of state.reels[reelIndex].comments) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex(r => r._id === commentId);
              if (replyIndex !== -1) {
                parentComment.replies[replyIndex].reactions = reactions;
                break;
              }
            }
          }
        }
      }
    },

    setPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.pagination = action.payload;
    },

    setSearchResults: (state, action: PayloadAction<{ reels: Reel[] }>) => {
      state.searchResults = action.payload.reels;
    },

    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },

    clearSearchResults: (state) => {
      state.searchResults = [];
      state.isSearching = false;
    },

    setSelectedReel: (state, action: PayloadAction<Reel | null>) => {
      state.selectedReel = action.payload;
    },

    resetReels: (state) => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setCreating,
  setReelsWithPagination,
  setReels,
  addReels,
  addReel,
  updateReel,
  removeReel,
  setUserReels,
  toggleLike,
  setComments,
  addComment,
  updateComment,
  removeComment,
  toggleCommentLike,
  setPagination,
  setSearchResults,
  setSearching,
  clearSearchResults,
  setSelectedReel,
  resetReels,
  setUserLikedReels,
  setUserSavedReels,
  addSavedReel,
  addLikedReel,
} = reelsSlice.actions;

export default reelsSlice.reducer;

export const selectReels = (state: { reels: ReelsState }) => state.reels.reels;
export const selectUserReels = (state: { reels: ReelsState }) => state.reels.userReels;
export const selectComments = (reelId: string) => (state: { reels: ReelsState }) => state.reels.comments[reelId] || [];
export const selectIsLoading = (state: { reels: ReelsState }) => state.reels.isLoading;
export const selectIsCreating = (state: { reels: ReelsState }) => state.reels.isCreating;
export const selectPagination = (state: { reels: ReelsState }) => state.reels.pagination;
export const selectSearchResults = (state: { reels: ReelsState }) => state.reels.searchResults;
export const selectSelectedReel = (state: { reels: ReelsState }) => state.reels.selectedReel;