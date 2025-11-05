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
      formData.append('textStyle', payload.textStyle)
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

export const deleteStory = createAsyncThunk(
  'stories/deleteStory',
  async (storyId: string, { rejectWithValue } ) => {
    try {
      const response = await api.delete(`/stories/delete/${storyId}`);
      return { storyId, data: response.data }
    } catch (error : any) {
      return rejectWithValue(error.response?.data.message)
    }
  }
)

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
    addNewStory: (state, action: PayloadAction<Story>) => {
      state.stories = [action.payload, ...state.stories];
      state.total += 1;
    },
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
      .addCase(fetchStory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStory.fulfilled, (state, action: PayloadAction<StoryResponse>) => {
        state.loading = false;
        if (action.payload.pagination.page === 1) {
          state.stories = action.payload.data;
        } else {
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
      
      .addCase(createStory.fulfilled, (state, action: PayloadAction<Story>) => {
        state.closeForm = true
        state.resetForm = true
        state.stories = [action.payload, ...state.stories];
        state.total += 1;
      })
      .addCase(createStory.rejected, (state, action) => {
        state.error = action.payload as string;
        state.resetForm = false
        state.closeForm = false
      })
      
      .addCase(likeStory.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        const reel = state.stories.find((r) => r._id === reelId);
        if (reel) {
          reel.reactions = data.reactions;
          reel.isLiked = data.isLiked;
        }
      })
      .addCase(likeStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(deleteStory.fulfilled, (state, action) => {
        state.stories = state.stories.filter((story) => story._id !== action.payload.storyId )
      })
      
      .addCase(addViewToStory.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        const story = state.stories.find((r) => r._id === reelId);
        if (story) {
          story.viewers = data.viewers;
        }
      })
      .addCase(addViewToStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(addReactionToStory.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        const reel = state.stories.find((r) => r._id === reelId);
        if (reel) {
          reel.reactions = data.reactions;
        }
      })
      .addCase(addReactionToStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(setStoryViewers.fulfilled, (state, action) => {
        const { reelId, data } = action.payload;
        const reel = state.stories.find((r) => r._id === reelId);
        if (reel) {
          reel.viewers = data.viewers;
        }
      })
      .addCase(setStoryViewers.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { resetStory, addNewStory, updateStoryLocally } = storiesSlice.actions;
export default storiesSlice.reducer;