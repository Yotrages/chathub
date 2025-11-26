"use client";
import React, { Component, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

interface WindowWithLocation extends Window {
  location: Location;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export class ChunkErrorBoundary extends Component<Props, State> {
  
  private maxRetries = 3;
  private reloadTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    if (!IS_PRODUCTION) {
      console.log('🛑 ChunkErrorBoundary: Error ignored (Development Mode)');
      console.error('Dev error:', error);
      return null; 
    }

    const isChunkError = 
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Failed to fetch dynamically imported module');

    if (isChunkError) {
      console.error('🔄 ChunkErrorBoundary: Chunk error detected', error);
      return {
        hasError: true,
        error,
      };
    }

    console.error('❌ Non-chunk error:', error);
    return null; 
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (!IS_PRODUCTION) {
      console.log('🛑 ChunkErrorBoundary: componentDidCatch skipped (Development)');
      return;
    }

    console.error('ChunkErrorBoundary caught error:', error, errorInfo);
    
    const isChunkError = 
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Failed to fetch dynamically imported module');

    if (!isChunkError) {
      console.log('Not a chunk error, ignoring');
      return;
    }

    const storedCount = parseInt(sessionStorage.getItem('chunkErrorCount') || '0');
    
    if (storedCount >= this.maxRetries) {
      console.error('❌ Max retries reached');
      this.setState({ errorCount: storedCount });
      return;
    }

    this.reloadTimeout = setTimeout(() => {
      this.handleReload();
    }, 2000);
  }

  componentDidMount() {
    if (IS_PRODUCTION) {
      const storedCount = parseInt(sessionStorage.getItem('chunkErrorCount') || '0');
      if (storedCount > 0 && !this.state.hasError) {
        console.log('✅ Page loaded successfully, resetting error count');
        sessionStorage.setItem('chunkErrorCount', '0');
      }
    }
  }

  componentWillUnmount() {
    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
    }
  }

  handleReload = () => {
    if (typeof window === 'undefined') return;

    const currentCount = parseInt(sessionStorage.getItem('chunkErrorCount') || '0');
    const newCount = currentCount + 1;
    
    sessionStorage.setItem('chunkErrorCount', String(newCount));
    
    this.setState({ errorCount: newCount }, () => {
      if (newCount < this.maxRetries) {
        console.log(`🔄 Reloading... (Attempt ${newCount}/${this.maxRetries})`);
        
        if ('caches' in window) {
          caches.keys().then(names => {
            Promise.all(names.map(name => caches.delete(name)))
              .then(() => {
                console.log('✅ Cache cleared');
                (window as WindowWithLocation).location.reload();
              })
              .catch(() => {
                (window as WindowWithLocation).location.reload();
              });
          });
        } else {
          (window as WindowWithLocation).location.reload();
        }
      } else {
        console.error('❌ Max retries reached, manual reload required');
      }
    });
  };

  handleManualReload = () => {
    if (typeof window === 'undefined') return;

    console.log('🔄 Manual reload initiated');
    
    if ('caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name)));
      });
    }
    
    sessionStorage.setItem('chunkErrorCount', '0');
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('force-reload', Date.now().toString());
    }
    
    (window as WindowWithLocation).location.href = (window as WindowWithLocation).location.pathname;
  };

  render() {
    if (!IS_PRODUCTION) {
      return this.props.children;
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 dark:from-gray-900 to-gray-100 dark:to-gray-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 text-center transition-colors duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Loading Error
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.state.errorCount >= this.maxRetries
                ? "We're having trouble loading the page. Please try refreshing manually."
                : "We're attempting to recover... This may take a moment."}
            </p>

            {this.state.errorCount >= this.maxRetries && (
              <button
                onClick={this.handleManualReload}
                className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Page
              </button>
            )}

            {this.state.errorCount < this.maxRetries && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500"></div>
                <span>Retrying... ({this.state.errorCount + 1}/{this.maxRetries})</span>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Error: {this.state.error?.message}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}