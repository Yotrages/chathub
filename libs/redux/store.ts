import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { createPersistStorage } from "./storage";
import authReducer from "./authSlice";
import chatReducer from "./chatSlice";
import postReducer from "./postSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  post: postReducer,
});

const persistConfig = {
  key: "root",
  storage: createPersistStorage(), 
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof rootReducer>; 
export type AppDispatch = typeof store.dispatch;