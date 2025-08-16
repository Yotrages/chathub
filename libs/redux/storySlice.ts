import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Story, StoryResponse, CreateStoryPayload } from '@/types/index';
import { api } from '../axios/config';
import { errorMessageHandler } from '../feedback/error-handler';

interface StoryState {
  stories: Story[];
  loading: boolean;
  error: string | null;
  page: number;
  closeForm: boolean;
  resetForm: boolean;
  hasMore: boolean;
  total: number;
}

const initialState: StoryState = {
  stories: [],
  loading: false,
  error: null,
  page: 1,
  closeForm: false,
  resetForm: false,
  hasMore: true,
  total: 0,
};

export const fetchStory = createAsyncThunk(
  'stories/fetchStory',
  async ({ page, limit }: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      const response = await api.get<StoryResponse>(`/stories?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stories');
    }
  }
);

export const createStory = createAsyncThunk(
  'stories/createStory',
  async (payload: CreateStoryPayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (payload.file) formData.append('file', payload.file);
      formData.append('text', payload.text);
      formData.append('fileType', payload.fileType);
      formData.append('textPosition', JSON.stringify(payload.textPosition));
      formData.append('background', payload.background || '');
      let onSuccess: () => void;
      const response = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data.data;
    } catch (error: any) {
      errorMessageHandler(error)
      return rejectWithValue(error.response?.data?.message || 'Failed to create reel');
    }
  }
);

export const likeStory = createAsyncThunk(
  'stories/likestory',
  async (reelId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/stories/like`, { reelId });
      return { reelId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like reel');
    }
  }
);

// New: Add view to reel
export const addViewToStory = createAsyncThunk(
  'stories/addViewToStory',
  async (reelId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/stories/viewers/${reelId}`);
      return { reelId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add view to reel');
    }
  }
);

// New: Add reaction to reel
export const addReactionToStory = createAsyncThunk(
  'stories/addReactionToStory',
  async ({ reelId, reactionType }: { reelId: string; reactionType: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`stories/reaction`, { reelId, reactionType });
      return { reelId, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reaction to reel');
    }
  }
);

// New: Set reel viewers (for tracking who viewed)
export const setStoryViewers = createAsyncThunk(
  'stories/setStoryViewers',
  async (reelId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/stories/viewers/${reelId}`);
      return { reelId, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set reel viewers');
    }
  }
);

export const getStoryViewers = createAsyncThunk(
  'stories/setStoryViewers',
  async (reelId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/stories/viewers/${reelId}`);
      return { reelId, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set reel viewers');
    }
  }
);

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    resetStory: (state) => {
      state.stories = [];
      state.page = 1;
      state.hasMore = true;
      state.total = 0;
    },
    // Add a new reel at the beginning (for real-time updates)
    addNewStory: (state, action: PayloadAction<Story>) => {
      state.stories = [action.payload, ...state.stories];
      state.total += 1;
    },
    // Update reel data locally (for optimistic updates)
    updateStoryLocally: (state, action: PayloadAction<{ reelId: string; updates: Partial<Story> }>) => {
      const { reelId, updates } = action.payload;
      const reel = state.stories.find((r) => r._id === reelId);
      if (reel) {
        Object.assign(reel, updates);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stories
      .addCase(fetchStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStory.fulfilled, (state, action: PayloadAction<StoryResponse>) => {
        state.loading = false;
        if (action.payload.pagination.page === 1) {
          // If it's the first page, replace all stories
          state.stories = action.payload.data;
        } else {
          // If it's not the first page, append to existing stories
          state.stories = [...state.stories, ...action.payload.data];
        }
        state.page = action.payload.pagination.page + 1;
        state.hasMore = action.payload.pagination.hasMore;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchStory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create reel
      .addCase(createStory.fulfilled, (state, action: PayloadAction<Story>) => {
        // Add the new reel at the beginning
        state.stories = [action.payload, ...state.stories];
        state.total += 1;
        state.closeForm = true
        state.resetForm = true
      })
      .addCase(createStory.rejected, (state, action) => {
        state.error = action.payload as string;
        state.resetForm = false
        state.closeForm = false
      })
      
      // Like reel
      .addCase(likeStory.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        const reel = state.stories.find((r) => r._id === reelId);
        if (reel) {
          reel.reactions = data.reactions;
          reel.likesCount = data.likesCount;
          reel.isLiked = data.isLiked;
        }
      })
      .addCase(likeStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Add view to reel
      .addCase(addViewToStory.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        const reel = state.stories.find((r) => r._id === reelId);
        if (reel) {
          reel.viewersCount = data.viewersCount;
          reel.viewers = data.viewers;
        }
      })
      .addCase(addViewToStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Add reaction to reel
      .addCase(addReactionToStory.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        const reel = state.stories.find((r) => r._id === reelId);
        if (reel) {
          reel.reactions = data.reactions;
          reel.likesCount = data.likesCount;
        }
      })
      .addCase(addReactionToStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Set reel viewers
      .addCase(setStoryViewers.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        const reel = state.stories.find((r) => r._id === reelId);
        if (reel) {
          reel.viewers = data.viewers;
          reel.viewersCount = data.viewersCount;
        }
      })
      .addCase(setStoryViewers.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { resetStory, addNewStory, updateStoryLocally } = storiesSlice.actions;
export default storiesSlice.reducer;