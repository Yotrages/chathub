import { IComment, IReply, Post } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CreatePost {
  content: string;
  image?: File[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PostsResponse {
  success: boolean;
  posts: Post[];
  pagination: PaginationInfo;
}

// Like interface to match your backend response
export interface LikeUser {
  _id: string;
  username?: string;
  avatar?: string;
}

interface PostsState {
  posts: Post[];
  userPosts: Post[];
  comments: { [postId: string]: IComment[] };
  isLoading: boolean;
  isCreating: boolean;
  pagination: PaginationInfo | null;
  searchResults: Post[];
  isSearching: boolean;
  selectedPost: Post | null;
}

const initialState: PostsState = {
  posts: [],
  userPosts: [],
  comments: {},
  isLoading: false,
  isCreating: false,
  pagination: null,
  searchResults: [],
  isSearching: false,
  selectedPost: null,
};

// Helper function to recursively find and update a reply
const findAndUpdateReply = (replies: IReply[], replyId: string, updates: Partial<IReply>): IReply[] => {
  return replies.map(reply => {
    if (reply._id === replyId) {
      return { ...reply, ...updates };
    }
    if (reply.replies && reply.replies.length > 0) {
      return {
        ...reply,
        replies: findAndUpdateReply(reply.replies, replyId, updates)
      };
    }
    return reply;
  });
};

// Helper function to recursively find and remove a reply
const findAndRemoveReply = (replies: IReply[], replyId: string): IReply[] => {
  return replies
    .map(reply => {
      if (reply.replies && reply.replies.length > 0) {
        return {
          ...reply,
          replies: findAndRemoveReply(reply.replies, replyId)
        };
      }
      return reply;
    })
    .filter(reply => reply._id !== replyId);
};

// Helper function to recursively add a reply to the correct parent
const addReplyToParent = (replies: IReply[], parentId: string, newReply: IReply): IReply[] => {
  return replies.map(reply => {
    if (reply._id === parentId) {
      return {
        ...reply,
        replies: reply.replies ? [newReply, ...reply.replies] : [newReply]
      };
    }
    if (reply.replies && reply.replies.length > 0) {
      return {
        ...reply,
        replies: addReplyToParent(reply.replies, parentId, newReply)
      };
    }
    return reply;
  });
};

// Helper function to toggle likes in nested replies
const updateReplyLikes = (replies: IReply[], replyId: string, likes: LikeUser[]): IReply[] => {
  return replies.map(reply => {
    if (reply._id === replyId) {
      return { ...reply, likes };
    }
    if (reply.replies && reply.replies.length > 0) {
      return {
        ...reply,
        replies: updateReplyLikes(reply.replies, replyId, likes)
      };
    }
    return reply;
  });
};

const postsSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload;
    },

    // Posts management with pagination
    setPostsWithPagination: (state, action: PayloadAction<PostsResponse>) => {
      console.log('Reducer received:', action.payload);
      state.posts = action.payload.posts;
      state.pagination = action.payload.pagination;
    },

    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },

    addPosts: (state, action: PayloadAction<Post[]>) => {
      const newPosts = action.payload.filter(
        newPost => !state.posts.some(existingPost => existingPost._id === newPost._id)
      );
      state.posts.push(...newPosts);
    },

    addPost: (state, action: PayloadAction<Post>) => {
      const exists = state.posts.find(p => p._id === action.payload._id);
      if (!exists) {
        state.posts.unshift(action.payload);
      }
    },

    updatePost: (state, action: PayloadAction<{post: Partial<Post>, _id: string }>) => {
      const index = state.posts.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload.post };
      }

      // Also update in user posts if exists
      const userIndex = state.userPosts.findIndex(p => p._id === action.payload._id);
      if (userIndex !== -1) {
        state.userPosts[userIndex] = { ...state.userPosts[userIndex], ...action.payload.post };
      }
    },

    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(p => p._id !== action.payload);
      state.userPosts = state.userPosts.filter(p => p._id !== action.payload);
      delete state.comments[action.payload];
    },

    // User posts
    setUserPosts: (state, action: PayloadAction<Post[]>) => {
      state.userPosts = action.payload;
    },

    // Post interactions - Updated to handle like objects
    toggleLike: (state, action: PayloadAction<{ postId: string; userId: string; likes: LikeUser[] }>) => {
      const { postId, likes } = action.payload;
      
      // Update in posts
      const postIndex = state.posts.findIndex(p => p._id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex].likes = likes;
      }
      
      // Update in user posts
      const userPostIndex = state.userPosts.findIndex(p => p._id === postId);
      if (userPostIndex !== -1) {
        state.userPosts[userPostIndex].likes = likes;
      }
    },

    // Comments management
    setComments: (state, action: PayloadAction<{ postId: string; comments: IComment[] }>) => {
      state.comments[action.payload.postId] = action.payload.comments;
    },

    addComment: (state, action: PayloadAction<{ postId: string; comment: IComment }>) => {
      const { postId, comment } = action.payload;
      
      if (!state.comments[postId]) {
        state.comments[postId] = [];
      }
      
      state.comments[postId].unshift(comment);
      
      // Add comment to post's comments array
      const postIndex = state.posts.findIndex(p => p._id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex].comments.unshift(comment);
      }

      const userPostIndex = state.userPosts.findIndex(p => p._id === postId);
      if (userPostIndex !== -1) {
        state.userPosts[userPostIndex].comments.unshift(comment);
      }
    },

    updateComment: (state, action: PayloadAction<{comment: Partial<IComment>, _id: string; postId: string }>) => {
      const { postId, _id } = action.payload;
      const comments = state.comments[postId];
      
      if (comments) {
        const commentIndex = comments.findIndex(c => c._id === _id);
        if (commentIndex !== -1) {
          state.comments[postId][commentIndex] = {
            ...comments[commentIndex],
            ...action.payload.comment
          };
        }
      }

      // Also update in post's comments array
      const postIndex = state.posts.findIndex(p => p._id === postId);
      if (postIndex !== -1) {
        const postCommentIndex = state.posts[postIndex].comments.findIndex(c => c._id === _id);
        if (postCommentIndex !== -1) {
          state.posts[postIndex].comments[postCommentIndex] = {
            ...state.posts[postIndex].comments[postCommentIndex],
            ...action.payload.comment
          };
        }
      }
    },

    removeComment: (state, action: PayloadAction<{ postId: string; commentId: string }>) => {
      const { postId, commentId } = action.payload;
      
      if (state.comments[postId]) {
        state.comments[postId] = state.comments[postId].filter(c => c._id !== commentId);
        
        // Remove from post's comments array
        const postIndex = state.posts.findIndex(p => p._id === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].comments = state.posts[postIndex].comments.filter(c => c._id !== commentId);
        }

        const userPostIndex = state.userPosts.findIndex(p => p._id === postId);
        if (userPostIndex !== -1) {
          state.userPosts[userPostIndex].comments = state.userPosts[userPostIndex].comments.filter(c => c._id !== commentId);
        }
      }
    },

    // Comment likes - Updated to handle like objects
    toggleCommentLike: (state, action: PayloadAction<{ postId: string; commentId: string; userId: string; likes: LikeUser[] }>) => {
      const { postId, commentId, likes } = action.payload;
      
      // Update in comments state
      const comments = state.comments[postId];
      if (comments) {
        const commentIndex = comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          comments[commentIndex].likes = likes;
        }
      }

      // Update in post's comments array
      const postIndex = state.posts.findIndex(p => p._id === postId);
      if (postIndex !== -1) {
        const postCommentIndex = state.posts[postIndex].comments.findIndex(c => c._id === commentId);
        if (postCommentIndex !== -1) {
          state.posts[postIndex].comments[postCommentIndex].likes = likes;
        }
      }

      // Update in user posts
      const userPostIndex = state.userPosts.findIndex(p => p._id === postId);
      if (userPostIndex !== -1) {
        const userPostCommentIndex = state.userPosts[userPostIndex].comments.findIndex(c => c._id === commentId);
        if (userPostCommentIndex !== -1) {
          state.userPosts[userPostIndex].comments[userPostCommentIndex].likes = likes;
        }
      }
    },

    // Reply management
    addReply: (state, action: PayloadAction<{ postId: string; commentId: string; reply: IReply; parentReplyId?: string }>) => {
      const { postId, commentId, reply, parentReplyId } = action.payload;
      
      // Update in comments state
      const comments = state.comments[postId];
      if (comments) {
        const commentIndex = comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          const comment = comments[commentIndex];
          
          if (parentReplyId) {
            // Add reply to a specific parent reply
            if (comment.replies) {
              comment.replies = addReplyToParent(comment.replies, parentReplyId, reply);
            }
          } else {
            // Add reply directly to comment
            if (!comment.replies) {
              comment.replies = [];
            }
            comment.replies.unshift(reply);
          }
        }
      }

      // Update in post's comments array
      const postIndex = state.posts.findIndex(p => p._id === postId);
      if (postIndex !== -1) {
        const postCommentIndex = state.posts[postIndex].comments.findIndex(c => c._id === commentId);
        if (postCommentIndex !== -1) {
          const comment = state.posts[postIndex].comments[postCommentIndex];
          
          if (parentReplyId) {
            if (comment.replies) {
              comment.replies = addReplyToParent(comment.replies, parentReplyId, reply);
            }
          } else {
            if (!comment.replies) {
              comment.replies = [];
            }
            comment.replies.unshift(reply);
          }
        }
      }

      // Update in user posts
      const userPostIndex = state.userPosts.findIndex(p => p._id === postId);
      if (userPostIndex !== -1) {
        const userPostCommentIndex = state.userPosts[userPostIndex].comments.findIndex(c => c._id === commentId);
        if (userPostCommentIndex !== -1) {
          const comment = state.userPosts[userPostIndex].comments[userPostCommentIndex];
          
          if (parentReplyId) {
            if (comment.replies) {
              comment.replies = addReplyToParent(comment.replies, parentReplyId, reply);
            }
          } else {
            if (!comment.replies) {
              comment.replies = [];
            }
            comment.replies.unshift(reply);
          }
        }
      }
    },

    updateReply: (state, action: PayloadAction<{ postId: string; commentId: string; replyId: string; updates: Partial<IReply> }>) => {
      const { postId, commentId, replyId, updates } = action.payload;
      
      // Update in comments state
      const comments = state.comments[postId];
      if (comments) {
        const commentIndex = comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1 && comments[commentIndex].replies) {
          comments[commentIndex].replies = findAndUpdateReply(comments[commentIndex].replies!, replyId, updates);
        }
      }

      // Update in post's comments array
      const postIndex = state.posts.findIndex(p => p._id === postId);
      if (postIndex !== -1) {
        const postCommentIndex = state.posts[postIndex].comments.findIndex(c => c._id === commentId);
        if (postCommentIndex !== -1 && state.posts[postIndex].comments[postCommentIndex].replies) {
          state.posts[postIndex].comments[postCommentIndex].replies = findAndUpdateReply(
            state.posts[postIndex].comments[postCommentIndex].replies!,
            replyId,
            updates
          );
        }
      }

      // Update in user posts
      const userPostIndex = state.userPosts.findIndex(p => p._id === postId);
      if (userPostIndex !== -1) {
        const userPostCommentIndex = state.userPosts[userPostIndex].comments.findIndex(c => c._id === commentId);
        if (userPostCommentIndex !== -1 && state.userPosts[userPostIndex].comments[userPostCommentIndex].replies) {
          state.userPosts[userPostIndex].comments[userPostCommentIndex].replies = findAndUpdateReply(
            state.userPosts[userPostIndex].comments[userPostCommentIndex].replies!,
            replyId,
            updates
          );
        }
      }
    },

    removeReply: (state, action: PayloadAction<{ postId: string; commentId: string; replyId: string }>) => {
      const { postId, commentId, replyId } = action.payload;
      
      // Update in comments state
      const comments = state.comments[postId];
      if (comments) {
        const commentIndex = comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1 && comments[commentIndex].replies) {
          comments[commentIndex].replies = findAndRemoveReply(comments[commentIndex].replies!, replyId);
        }
      }

      // Update in post's comments array
      const postIndex = state.posts.findIndex(p => p._id === postId);
      if (postIndex !== -1) {
        const postCommentIndex = state.posts[postIndex].comments.findIndex(c => c._id === commentId);
        if (postCommentIndex !== -1 && state.posts[postIndex].comments[postCommentIndex].replies) {
          state.posts[postIndex].comments[postCommentIndex].replies = findAndRemoveReply(
            state.posts[postIndex].comments[postCommentIndex].replies!,
            replyId
          );
        }
      }

      // Update in user posts
      const userPostIndex = state.userPosts.findIndex(p => p._id === postId);
      if (userPostIndex !== -1) {
        const userPostCommentIndex = state.userPosts[userPostIndex].comments.findIndex(c => c._id === commentId);
        if (userPostCommentIndex !== -1 && state.userPosts[userPostIndex].comments[userPostCommentIndex].replies) {
          state.userPosts[userPostIndex].comments[userPostCommentIndex].replies = findAndRemoveReply(
            state.userPosts[userPostIndex].comments[userPostCommentIndex].replies!,
            replyId
          );
        }
      }
    },

    // Reply likes - Updated to handle like objects
    toggleReplyLike: (state, action: PayloadAction<{ postId: string; commentId: string; replyId: string; userId: string; likes: LikeUser[] }>) => {
      const { postId, commentId, replyId, likes } = action.payload;
      
      // Update in comments state
      const comments = state.comments[postId];
      if (comments) {
        const commentIndex = comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1 && comments[commentIndex].replies) {
          comments[commentIndex].replies = updateReplyLikes(comments[commentIndex].replies!, replyId, likes);
        }
      }

      // Update in post's comments array
      const postIndex = state.posts.findIndex(p => p._id === postId);
      if (postIndex !== -1) {
        const postCommentIndex = state.posts[postIndex].comments.findIndex(c => c._id === commentId);
        if (postCommentIndex !== -1 && state.posts[postIndex].comments[postCommentIndex].replies) {
          state.posts[postIndex].comments[postCommentIndex].replies = updateReplyLikes(
            state.posts[postIndex].comments[postCommentIndex].replies!,
            replyId,
            likes
          );
        }
      }

      // Update in user posts
      const userPostIndex = state.userPosts.findIndex(p => p._id === postId);
      if (userPostIndex !== -1) {
        const userPostCommentIndex = state.userPosts[userPostIndex].comments.findIndex(c => c._id === commentId);
        if (userPostCommentIndex !== -1 && state.userPosts[userPostIndex].comments[userPostCommentIndex].replies) {
          state.userPosts[userPostIndex].comments[userPostCommentIndex].replies = updateReplyLikes(
            state.userPosts[userPostIndex].comments[userPostCommentIndex].replies!,
            replyId,
            likes
          );
        }
      }
    },

    // Pagination
    setPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.pagination = action.payload;
    },

    // Search
    setSearchResults: (state, action: PayloadAction<{posts: Post[]}>) => {
      state.searchResults = action.payload.posts;
    },

    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },

    clearSearchResults: (state) => {
      state.searchResults = [];
      state.isSearching = false;
    },

    // Selected post (for modal/detail view)
    setSelectedPost: (state, action: PayloadAction<Post | null>) => {
      state.selectedPost = action.payload;
    },

    // Reset state
    resetPosts: (state) => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setCreating,
  setPostsWithPagination,
  setPosts,
  addPosts,
  addPost,
  updatePost,
  removePost,
  setUserPosts,
  toggleLike,
  setComments,
  addComment,
  updateComment,
  removeComment,
  toggleCommentLike,
  addReply,
  updateReply,
  removeReply,
  toggleReplyLike,
  setPagination,
  setSearchResults,
  setSearching,
  clearSearchResults,
  setSelectedPost,
  resetPosts,
} = postsSlice.actions;

export default postsSlice.reducer;

// Selectors
export const selectPosts = (state: { posts: PostsState }) => state.posts.posts;
export const selectUserPosts = (state: { posts: PostsState }) => state.posts.userPosts;
export const selectComments = (postId: string) => (state: { posts: PostsState }) => 
  state.posts.comments[postId] || [];
export const selectIsLoading = (state: { posts: PostsState }) => state.posts.isLoading;
export const selectIsCreating = (state: { posts: PostsState }) => state.posts.isCreating;
export const selectPagination = (state: { posts: PostsState }) => state.posts.pagination;
export const selectSearchResults = (state: { posts: PostsState }) => state.posts.searchResults;
export const selectSelectedPost = (state: { posts: PostsState }) => state.posts.selectedPost;