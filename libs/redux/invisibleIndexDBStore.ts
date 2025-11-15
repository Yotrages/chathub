import { WebStorage } from "redux-persist/es/types";

class InvisibleIndexedDBStorage implements WebStorage {
  private dbName = '__app_cache__';
  private storeName = '__data__';
  private version = 1;
  private db: IDBDatabase | null = null;
  private isClient: boolean;
  private initPromise: Promise<void> | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.isClient = typeof window !== 'undefined' && 'indexedDB' in window;
    if (!this.isClient) {
      console.log('❌ IndexedDBStorage: Not in browser environment');
    }
  }

  private async initDB(): Promise<void> {
    if (!this.isClient || this.isInitialized) return Promise.resolve();
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName);
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('type', 'type', { unique: false });
          console.log('✅ IndexedDB object store created');
        }
      };
    });

    return this.initPromise;
  }

  private obfuscate(data: string): string {
    try {
      const utf8Encoded = encodeURIComponent(data);
      const base64 = btoa(utf8Encoded);
      return base64.split('').reverse().join('');
    } catch (error) {
      console.warn('⚠️ Obfuscation failed, using simple reversal:', error);
      return data.split('').reverse().join('');
    }
  }

  private deobfuscate(data: string): string {
    try {
      const reversed = data.split('').reverse().join('');
      const decoded = atob(reversed);
      return decodeURIComponent(decoded);
    } catch (error) {
      console.warn('⚠️ Deobfuscation failed, trying simple reversal:', error);
      try {
        return data.split('').reverse().join('');
      } catch (fallbackError) {
        console.warn('⚠️ Fallback deobfuscation also failed, returning as is:', fallbackError);
        return data;
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.isClient) {
      return Promise.resolve(null);
    }
    
    try {
      await this.initDB();
      if (!this.db) {
        console.warn('⚠️ Database not available for getItem:', key);
        return null;
      }
      
      return new Promise((resolve) => {
        if (!this.db) return resolve(null);
        
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.get(key);

        request.onsuccess = () => {
          if (request.result && request.result.data) {
            try {
              const deobfuscated = this.deobfuscate(request.result.data);
              console.log(`📥 Retrieved data for key: ${key}`, { size: deobfuscated.length });
              resolve(deobfuscated);
            } catch (error) {
              console.error('❌ Failed to deobfuscate data for key:', key, error);
              resolve(null);
            }
          } else {
            console.log(`📭 No data found for key: ${key}`);
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('❌ Error retrieving data for key:', key, request.error);
          resolve(null);
        };

        transaction.onerror = () => {
          console.error('❌ Transaction error for getItem:', key, transaction.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('❌ getItem failed for key:', key, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.isClient) {
      return Promise.resolve();
    }
    
    try {
      await this.initDB();
      if (!this.db) {
        console.warn('⚠️ Database not available for setItem:', key);
        return;
      }
      
      return new Promise((resolve) => {
        if (!this.db) return resolve();
        
        try {
          const obfuscated = this.obfuscate(value);
          const dataWithMeta = {
            data: obfuscated,
            timestamp: Date.now(),
            type: this.getDataType(key),
            size: new Blob([value]).size
          };
          
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const objectStore = transaction.objectStore(this.storeName);
          const request = objectStore.put(dataWithMeta, key);

          request.onsuccess = () => {
            console.log(`💾 Data stored for key: ${key}`, { size: dataWithMeta.size });
            resolve();
          };

          request.onerror = () => {
            console.error('❌ Error storing data for key:', key, request.error);
            resolve();
          };

          transaction.onerror = () => {
            console.error('❌ Transaction error for setItem:', key, transaction.error);
            resolve();
          };
          
          setTimeout(() => this.cleanupOldData(), 1000);
        } catch (error) {
          console.error('❌ setItem failed for key:', key, error);
          resolve();
        }
      });
    } catch (error) {
      console.error('❌ setItem initialization failed for key:', key, error);
      return Promise.resolve();
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.isClient) {
      return Promise.resolve();
    }
    
    try {
      await this.initDB();
      if (!this.db) {
        console.warn('⚠️ Database not available for removeItem:', key);
        return;
      }
      
      return new Promise((resolve) => {
        if (!this.db) return resolve();
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.delete(key);

        request.onsuccess = () => {
          console.log(`🗑️ Data removed for key: ${key}`);
          resolve();
        };

        request.onerror = () => {
          console.error('❌ Error removing data for key:', key, request.error);
          resolve();
        };
      });
    } catch (error) {
      console.error('❌ removeItem failed for key:', key, error);
      return Promise.resolve();
    }
  }

  private getDataType(key: string): string {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('post')) return 'posts';
    if (keyLower.includes('reel')) return 'reels';
    if (keyLower.includes('story')) return 'stories';
    if (keyLower.includes('chat')) return 'chats';
    if (keyLower.includes('auth')) return 'auth';
    return 'other';
  }

  private async cleanupOldData(): Promise<void> {
    if (!this.isClient || !this.db) return;

    try {
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('timestamp');
      
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      let deletedCount = 0;
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else if (deletedCount > 0) {
          console.log(`🧹 Cleaned up ${deletedCount} old entries`);
        }
      };
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async getStorageInfo(): Promise<{ totalItems: number; totalSize: number }> {
    if (!this.isClient) return { totalItems: 0, totalSize: 0 };
    
    try {
      await this.initDB();
      if (!this.db) return { totalItems: 0, totalSize: 0 };
      
      return new Promise((resolve) => {
        if (!this.db) return resolve({ totalItems: 0, totalSize: 0 });
        
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.getAll();

        request.onsuccess = () => {
          const items = request.result;
          const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
          const info = {
            totalItems: items.length,
            totalSize
          };
          console.log('📊 Storage info:', info);
          resolve(info);
        };

        request.onerror = () => {
          console.error('❌ Failed to get storage info:', request.error);
          resolve({ totalItems: 0, totalSize: 0 });
        };
      });
    } catch (error) {
      console.error('❌ getStorageInfo failed:', error);
      return { totalItems: 0, totalSize: 0 };
    }
  }

  async clearAll(): Promise<void> {
    if (!this.isClient) return Promise.resolve();
    
    try {
      await this.initDB();
      if (!this.db) return;
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          console.log('🗑️ All data cleared from IndexedDB');
          resolve();
        };
        request.onerror = () => {
          console.error('❌ Failed to clear data:', request.error);
          resolve();
        };
      });
    } catch (error) {
      console.error('❌ clearAll failed:', error);
      return Promise.resolve();
    }
  }

  async isWorking(): Promise<boolean> {
    if (!this.isClient) return false;
    
    try {
      await this.initDB();
      return this.db !== null && this.isInitialized;
    } catch (error) {
      console.error('❌ Storage check failed:', error);
      return false;
    }
  }
}

const fallbackStorage: WebStorage = {
  getItem: () => {
    console.log('⚠️ Fallback storage getItem called (no-op)');
    return Promise.resolve(null);
  },
  setItem: () => {
    console.log('⚠️ Fallback storage setItem called (no-op)');
    return Promise.resolve();
  },
  removeItem: () => {
    console.log('⚠️ Fallback storage removeItem called (no-op)');
    return Promise.resolve();
  },
};

export function createInvisibleStorage(): WebStorage {
  if (typeof window === 'undefined') {
    console.log('🔴 SSR detected, using fallback storage (will persist on client)');
    return fallbackStorage;
  }
  
  if (!('indexedDB' in window)) {
    console.warn('❌ IndexedDB not supported, using fallback storage');
    return fallbackStorage;
  }
  
  try {
    const storage = new InvisibleIndexedDBStorage();
    console.log('✅ IndexedDB storage created successfully');
    return storage;
  } catch (error) {
    console.error('❌ Failed to create IndexedDB storage, using fallback:', error);
    return fallbackStorage;
  }
}

export default createInvisibleStorage;