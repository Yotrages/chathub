import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { createTransform } from "redux-persist";
import { useEffect, useState } from 'react';
import createInvisibleStorage from './invisibleIndexDBStore';
import authReducer from "./authSlice";
import chatReducer from "./chatSlice";
import postReducer from "./postSlice";
import storyReducer from './storySlice';
import reelsReducer from './reelsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  post: postReducer,
  stories: storyReducer,
  reels: reelsReducer
});

export type RootState = ReturnType<typeof rootReducer>;

const offlineStorageTransform = createTransform<any, any, RootState>(
  (inboundState: any, key: string | number | symbol) => {
    console.log(`Persisting ${String(key)}:`, { 
      type: typeof inboundState, 
      keys: Object.keys(inboundState || {}),
      dataSize: JSON.stringify(inboundState).length 
    });
    
    return inboundState;
  },
  (outboundState: any, key: string | number | symbol) => {
    console.log(`Rehydrating ${String(key)}:`, { 
      type: typeof outboundState, 
      keys: Object.keys(outboundState || {}),
      dataSize: JSON.stringify(outboundState).length 
    });
    
    return {
      ...outboundState,
      loading: false,
      error: null,
    };
  }
);

const storage = createInvisibleStorage();

const persistConfig = {
  key: "root",
  storage: storage,
  transforms: [offlineStorageTransform],
  throttle: 1000, 
  serialize: true, 
  debug: process.env.NODE_ENV === 'development', 
  whitelist: ['auth', 'chat', 'post', 'stories', 'reels'], 
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['register', 'rehydrate'],
        ignoredPaths: ['_persist'],
      },
    }),
  devTools: process.env.NODE_ENV === 'development',
});

export const persistor = persistStore(store, null, () => {
  console.log('Redux persist rehydration complete');
});

persistor.subscribe(() => {
  console.log('Persistor state changed:', persistor.getState());
});

export type AppDispatch = typeof store.dispatch;

export const useInvisibleStorageInfo = () => {
  const [storageInfo, setStorageInfo] = useState({ 
    totalItems: 0, 
    totalSize: 0,
    isOnline: true,
    isWorking: false 
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStorageInfo = async () => {
      try {
        const storage = createInvisibleStorage();
        
        const isWorking = 'isWorking' in storage && typeof storage.isWorking === 'function' 
          ? await (storage as any).isWorking() 
          : true;
        
        let info = { totalItems: 0, totalSize: 0 };
        if ('getStorageInfo' in storage && typeof storage.getStorageInfo === 'function') {
          info = await (storage as any).getStorageInfo();
        }
        
        setStorageInfo({
          ...info,
          isOnline: navigator.onLine,
          isWorking
        });
      } catch (error) {
        console.warn('Failed to get storage info:', error);
        setStorageInfo(prev => ({
          ...prev,
          isOnline: navigator.onLine,
          isWorking: false
        }));
      }
    };

    updateStorageInfo();

    const interval = setInterval(updateStorageInfo, 5000);

    const handleOnline = () => {
      console.log('App came online');
      updateStorageInfo();
    };
    const handleOffline = () => {
      console.log('App went offline');
      updateStorageInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...storageInfo,
    sizeInMB: (storageInfo.totalSize / (1024 * 1024)).toFixed(2),
  };
};

export const manualPersist = () => {
  persistor.persist();
};

export const checkPersistedData = async () => {
  const storage = createInvisibleStorage();
  try {
    const rootData = await storage.getItem('persist:root');
    console.log('Persisted root data:', rootData ? 'Found' : 'Not found');
    
    if (rootData) {
      const parsed = JSON.parse(rootData);
      console.log('Persisted slices:', Object.keys(parsed));
      return parsed;
    }
  } catch (error) {
    console.error('Failed to check persisted data:', error);
  }
  return null;
};

export const clearPersistedData = async () => {
  try {
    const storage = createInvisibleStorage();
    if ('clearAll' in storage && typeof storage.clearAll === 'function') {
      await (storage as any).clearAll();
      console.log('All persisted data cleared');
    }
    
    persistor.purge();
  } catch (error) {
    console.error('Failed to clear persisted data:', error);
  }
};