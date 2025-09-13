import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IComment, Post } from '@/types';

export interface CreatePost {
  content: string;
  images?: File[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PostsResponse {
  success: boolean;
  posts: Post[];
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

interface PostsState {
  posts: Post[];
  userPosts: Post[];
  likedPosts: Post[];
  savedPosts: Post[];
  videoPosts: Post[]; 
  trendingVideos: Post[]; 
  comments: { [postId: string]: IComment[] };
  isLoading: boolean;
  isCreating: boolean;
  isLoadingVideos: boolean; 
  pagination: {
    posts: PaginationInfo | null;
    userPosts: PaginationInfo | null;
    likedPosts: PaginationInfo | null;
    savedPosts: PaginationInfo | null;
    videoPosts: PaginationInfo | null; 
    trendingVideos: PaginationInfo | null; 
    comment: { [postId: string]: PaginationInfo } | null;
  };
  searchResults: Post[];
  isSearching: boolean;
  selectedPost: Post | null;
  selectedVideoPost: Post | null; 
}

const initialState: PostsState = {
  posts: [],
  userPosts: [],
  likedPosts: [],
  savedPosts: [],
  videoPosts: [],
  trendingVideos: [],
  comments: {},
  isLoading: false,
  isCreating: false,
  isLoadingVideos: false,
  pagination: {
    posts: null,
    userPosts: null,
    likedPosts: null,
    savedPosts: null,
    videoPosts: null,
    trendingVideos: null,
    comment: null,
  },
  searchResults: [],
  isSearching: false,
  selectedPost: null,
  selectedVideoPost: null,
};

const postsSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCreating: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload;
    },
    setLoadingVideos: (state, action: PayloadAction<boolean>) => {
      state.isLoadingVideos = action.payload;
    },
    setPostsWithPagination: (state, action: PayloadAction<PostsResponse>) => {
      state.posts = action.payload.posts;
      state.pagination.posts = action.payload.pagination;
    },
    setVideoPostsWithPagination: (state, action: PayloadAction<PostsResponse>) => {
      state.videoPosts = action.payload.posts;
      state.pagination.videoPosts = action.payload.pagination;
    },
    addVideoPosts: (state, action: PayloadAction<Post[]>) => {
      const newPosts = action.payload.filter(
        (newPost) => !state.videoPosts.some((existingPost) => existingPost._id === newPost._id)
      );
      state.videoPosts.push(...newPosts);
    },
    setTrendingVideosWithPagination: (state, action: PayloadAction<PostsResponse>) => {
      state.trendingVideos = action.payload.posts;
      state.pagination.trendingVideos = action.payload.pagination;
    },
    addTrendingVideos: (state, action: PayloadAction<Post[]>) => {
      const newPosts = action.payload.filter(
        (newPost) => !state.trendingVideos.some((existingPost) => existingPost._id === newPost._id)
      );
      state.trendingVideos.push(...newPosts);
    },
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },
    addPosts: (state, action: PayloadAction<Post[]>) => {
      const newPosts = action.payload.filter(
        (newPost) => !state.posts.some((existingPost) => existingPost._id === newPost._id)
      );
      state.posts.push(...newPosts);
    },
    addUserPosts: (state, action: PayloadAction<Post[]>) => {
      const newPosts = action.payload.filter(
        (newPost) => !state.userPosts.some((existingPost) => existingPost._id === newPost._id)
      );
      state.userPosts.push(...newPosts);
    },
    addLikedPosts: (state, action: PayloadAction<Post[]>) => {
      const newPosts = action.payload.filter(
        (newPost) => !state.likedPosts.some((existingPost) => existingPost._id === newPost._id)
      );
      state.likedPosts.push(...newPosts);
    },
    addSavedPosts: (state, action: PayloadAction<Post[]>) => {
      const newPosts = action.payload.filter(
        (newPost) => !state.savedPosts.some((existingPost) => existingPost._id === newPost._id)
      );
      state.savedPosts.push(...newPosts);
    },
    addPost: (state, action: PayloadAction<Post>) => {
      const exists = state.posts.find((p) => p._id === action.payload._id);
      if (!exists) {
        state.posts.unshift(action.payload);
      }
    },
    addUserPost: (state, action: PayloadAction<Post>) => {
      const exists = state.userPosts.find((p) => p._id === action.payload._id);
      if (!exists) {
        state.userPosts.unshift(action.payload);
      }
    },
    addSavedPost: (state, action: PayloadAction<Post>) => {
      const exists = state.savedPosts.find((p) => p._id === action.payload._id);
      if (!exists) {
        state.savedPosts.unshift(action.payload);
      }
    },
    addLikedPost: (state, action: PayloadAction<Post>) => {
      const exists = state.likedPosts.find((p) => p._id === action.payload._id);
      if (!exists) {
        state.likedPosts.unshift(action.payload);
      }
    },
    updatePost: (state, action: PayloadAction<{ post: Partial<Post>; _id: string }>) => {
      const updatePostInArray = (posts: Post[]) => {
        const index = posts.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          posts[index] = { ...posts[index], ...action.payload.post };
        }
      };

      updatePostInArray(state.posts);
      updatePostInArray(state.userPosts);
      updatePostInArray(state.likedPosts);
      updatePostInArray(state.savedPosts);
      updatePostInArray(state.videoPosts);
      updatePostInArray(state.trendingVideos);
    },
    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter((p) => p._id !== action.payload);
      state.userPosts = state.userPosts.filter((p) => p._id !== action.payload);
      state.likedPosts = state.likedPosts.filter((p) => p._id !== action.payload);
      state.savedPosts = state.savedPosts.filter((p) => p._id !== action.payload);
      state.videoPosts = state.videoPosts.filter((p) => p._id !== action.payload);
      state.trendingVideos = state.trendingVideos.filter((p) => p._id !== action.payload);
      delete state.comments[action.payload];
    },
    setUserPosts: (state, action: PayloadAction<PostsResponse>) => {
      state.userPosts = action.payload.posts;
      state.pagination.userPosts = action.payload.pagination;
    },
    setUserLikedPosts: (state, action: PayloadAction<PostsResponse>) => {
      state.likedPosts = action.payload.posts;
      state.pagination.likedPosts = action.payload.pagination;
    },
    setUserSavedPosts: (state, action: PayloadAction<PostsResponse>) => {
      state.savedPosts = action.payload.posts;
      state.pagination.savedPosts = action.payload.pagination;
    },
    toggleLike: (state, action: PayloadAction<{ postId: string; userId: string; reactions: ReactedUser[] }>) => {
      const { postId, reactions } = action.payload;
      
      const updateReactionsInArray = (posts: Post[]) => {
        const postIndex = posts.findIndex((p) => p._id === postId);
        if (postIndex !== -1) {
          posts[postIndex].reactions = reactions;
        }
      };

      updateReactionsInArray(state.posts);
      updateReactionsInArray(state.userPosts);
      updateReactionsInArray(state.likedPosts);
      updateReactionsInArray(state.videoPosts);
      updateReactionsInArray(state.trendingVideos);
    },
    setComments: (state, action: PayloadAction<{ postId: string; comments: IComment[] }>) => {
      console.log(`Setting comments for postId ${action.payload.postId}:`, action.payload.comments);
      state.comments[action.payload.postId] = action.payload.comments;
    },
    addComment: (state, action: PayloadAction<{ postId: string; comment: IComment }>) => {
      const { postId, comment } = action.payload;
      console.log(`Adding comment for postId ${postId}:`, comment);
      if (!state.comments[postId]) {
        state.comments[postId] = [];
      }
      if (comment.parentCommentId) {
        const parentComment = state.comments[postId].find((c) => c._id === comment.parentCommentId);
        if (parentComment) {
          parentComment.replies = parentComment.replies ? [comment, ...parentComment.replies] : [comment];
          parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
        }
      } else {
        state.comments[postId].unshift(comment);
      }
    },
    updateComment: (
      state,
      action: PayloadAction<{ comment: Partial<IComment>; _id: string; postId: string }>
    ) => {
      const { postId, _id, comment } = action.payload;
      const comments = state.comments[postId];
      if (comments) {
        const commentIndex = comments.findIndex((c) => c._id === _id);
        if (commentIndex !== -1) {
          state.comments[postId][commentIndex] = { ...comments[commentIndex], ...comment };
        } else {
          for (const parentComment of comments) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex((r) => r._id === _id);
              if (replyIndex !== -1) {
                parentComment.replies[replyIndex] = {
                  ...parentComment.replies[replyIndex],
                  ...comment,
                };
                break;
              }
            }
          }
        }
      }
    },
    removeComment: (state, action: PayloadAction<{ postId: string; commentId: string }>) => {
      const { postId, commentId } = action.payload;
      if (state.comments[postId]) {
        const commentIndex = state.comments[postId].findIndex((c) => c._id === commentId);
        if (commentIndex !== -1) {
          state.comments[postId].splice(commentIndex, 1);
        } else {
          for (const parentComment of state.comments[postId]) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex((r) => r._id === commentId);
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
    toggleCommentLike: (
      state,
      action: PayloadAction<{
        postId: string;
        commentId: string;
        userId: string;
        reactions: ReactedUser[];
      }>
    ) => {
      const { postId, commentId, reactions } = action.payload;
      if (state.comments[postId]) {
        const commentIndex = state.comments[postId].findIndex((c) => c._id === commentId);
        if (commentIndex !== -1) {
          state.comments[postId][commentIndex].reactions = reactions;
        } else {
          for (const parentComment of state.comments[postId]) {
            if (parentComment.replies) {
              const replyIndex = parentComment.replies.findIndex((r) => r._id === commentId);
              if (replyIndex !== -1) {
                parentComment.replies[replyIndex].reactions = reactions;
                break;
              }
            }
          }
        }
      }
    },
    setPagination: (
      state,
      action: PayloadAction<{ postId: string; pagination: PaginationInfo }>
    ) => {
      if (!state.pagination.comment) {
        state.pagination.comment = {};
      }
      state.pagination.comment[action.payload.postId] = action.payload.pagination;
    },
    setSearchResults: (state, action: PayloadAction<{ posts: Post[] }>) => {
      state.searchResults = action.payload.posts;
    },
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.isSearching = false;
    },
    setSelectedPost: (state, action: PayloadAction<Post | null>) => {
      state.selectedPost = action.payload;
    },
    setSelectedVideoPost: (state, action: PayloadAction<Post | null>) => {
      state.selectedVideoPost = action.payload;
    },
    resetPosts: (state) => {
      return initialState;
    },
    resetUserPosts: (state) => {
      state.userPosts = [];
      state.pagination.userPosts = null;
    },
    resetLikedPosts: (state) => {
      state.likedPosts = [];
      state.pagination.likedPosts = null;
    },
    resetSavedPosts: (state) => {
      state.savedPosts = [];
      state.pagination.savedPosts = null;
    },
    resetVideoPosts: (state) => {
      state.videoPosts = [];
      state.pagination.videoPosts = null;
    },
    resetTrendingVideos: (state) => {
      state.trendingVideos = [];
      state.pagination.trendingVideos = null;
    },
  },
});

export const {
  setLoading,
  setCreating,
  setLoadingVideos,
  setPostsWithPagination,
  setVideoPostsWithPagination,
  setTrendingVideosWithPagination,
  addVideoPosts,
  addTrendingVideos,
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
  setSearchResults,
  setSearching,
  clearSearchResults,
  setSelectedPost,
  setSelectedVideoPost,
  resetPosts,
  setUserLikedPosts,
  setUserSavedPosts,
  addSavedPost,
  addLikedPost,
  addUserPost,
  addUserPosts,
  addLikedPosts,
  addSavedPosts,
  resetUserPosts,
  resetLikedPosts,
  resetSavedPosts,
  resetVideoPosts,
  resetTrendingVideos,
  setPagination,
} = postsSlice.actions;

export default postsSlice.reducer;

export const selectPosts = (state: { post: PostsState }) => state.post.posts;
export const selectUserPosts = (state: { post: PostsState }) => state.post.userPosts;
export const selectComments = (postId: string) => (state: { post: PostsState }) =>
  state.post?.comments[postId] || [];
export const selectIsLoading = (state: { post: PostsState }) => state.post.isLoading;
export const selectIsCreating = (state: { post: PostsState }) => state.post.isCreating;
export const selectPagination = (type: 'posts' | 'userPosts' | 'likedPosts' | 'savedPosts' | 'comment', postId?: string) => (
  state: { post: PostsState }
) => (type === 'comment' && postId ? state.post?.pagination.comment?.[postId] : state.post.pagination[type]);
export const selectSearchResults = (state: { post: PostsState }) => state.post.searchResults;
export const selectSelectedPost = (state: { post: PostsState }) => state.post.selectedPost;