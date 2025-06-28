import { WebStorage } from "redux-persist/es/types";

export function createPersistStorage(): WebStorage {
  if (typeof window === "undefined") {
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }
  return {
    getItem: (key) => Promise.resolve(sessionStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(sessionStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(sessionStorage.removeItem(key)),
  };
}