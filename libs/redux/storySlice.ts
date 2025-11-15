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
     if (payload.fileType) formData.append('fileType', payload.fileType);
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
      return rejectWithValue(error.response?.data?.message || 'Failed to create story');
    }
  }
);

export const likeStory = createAsyncThunk(
  'stories/likestory',
  async (storyId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/stories/like`, { storyId });
      return { storyId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like story');
    }
  }
);

export const addViewToStory = createAsyncThunk(
  'stories/addViewToStory',
  async (storyId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/stories/viewers/${storyId}`);
      return { storyId, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add view to story');
    }
  }
);

export const addReactionToStory = createAsyncThunk(
  'stories/addReactionToStory',
  async ({ storyId, reactionType }: { storyId: string; reactionType: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`stories/reaction`, { storyId, reactionType });
      return { storyId, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reaction to story');
    }
  }
);

export const setStoryViewers = createAsyncThunk(
  'stories/setStoryViewers',
  async (storyId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/stories/viewers/${storyId}`);
      return { storyId, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set story viewers');
    }
  }
);

export const getStoryViewers = createAsyncThunk(
  'stories/setStoryViewers',
  async (storyId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/stories/viewers/${storyId}`);
      return { storyId, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set story viewers');
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
    updateStoryLocally: (state, action: PayloadAction<{ storyId: string; updates: Partial<Story> }>) => {
      const { storyId, updates } = action.payload;
      const story = state.stories.find((r) => r._id === storyId);
      if (story) {
        Object.assign(story, updates);
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
        const { storyId, data } = action.payload;
        const story = state.stories.find((r) => r._id === storyId);
        if (story) {
          story.reactions = data.reactions;
          story.isLiked = data.isLiked;
        }
      })
      .addCase(likeStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(deleteStory.fulfilled, (state, action) => {
        state.stories = state.stories.filter((story) => story._id !== action.payload.storyId )
      })
      
      .addCase(addViewToStory.fulfilled, (state, action) => {
        const { storyId, data } = action.payload;
        const story = state.stories.find((r) => r._id === storyId);
        if (story) {
          story.viewers = data.viewers;
        }
      })
      .addCase(addViewToStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(addReactionToStory.fulfilled, (state, action) => {
        const { storyId, data } = action.payload;
        const story = state.stories.find((r) => r._id === storyId);
        if (story) {
          story.reactions = data.reactions;
        }
      })
      .addCase(addReactionToStory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      .addCase(setStoryViewers.fulfilled, (state, action) => {
        const { storyId, data } = action.payload;
        const story = state.stories.find((r) => r._id === storyId);
        if (story) {
          story.viewers = data.viewers;
        }
      })
      .addCase(setStoryViewers.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { resetStory, addNewStory, updateStoryLocally } = storiesSlice.actions;
export default storiesSlice.reducer;