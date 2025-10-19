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

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError = 
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Failed to fetch');

    if (isChunkError) {
      return {
        hasError: true,
        error,
        errorCount: 0,
      };
    }

    console.error('Non-chunk error:', error);
    return { hasError: false, error: null, errorCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    const isChunkError = 
      error.message?.includes('Loading chunk') ||
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Failed to fetch');

    if (isChunkError && this.state.errorCount < 3) {
      setTimeout(() => {
        this.handleReload();
      }, 2000);
    }
  }

  handleReload = () => {
    if (typeof window === 'undefined') return;

    this.setState(
      (prevState) => ({
        errorCount: prevState.errorCount + 1,
      }),
      () => {
        if (this.state.errorCount < 3) {
          if ('caches' in window) {
            caches.keys().then(names => {
              Promise.all(names.map(name => caches.delete(name)))
                .then(() => {
                  (window as WindowWithLocation).location.reload();
                });
            });
          } else {
            (window as WindowWithLocation).location.reload();
          }
        }
      }
    );
  };

  handleManualReload = () => {
    if (typeof window === 'undefined') return;

    if ('caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name)));
      });
    }
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('force-reload', Date.now().toString());
    }
    
    (window as WindowWithLocation).location.href = (window as WindowWithLocation).location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Loading Error
            </h1>
            
            <p className="text-gray-600 mb-6">
              {this.state.errorCount >= 3 
                ? "We're having trouble loading the page. Please try refreshing manually."
                : "We're attempting to recover... This may take a moment."}
            </p>

            {this.state.errorCount >= 3 && (
              <button
                onClick={this.handleManualReload}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Page
              </button>
            )}

            {this.state.errorCount < 3 && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
                <span>Retrying... ({this.state.errorCount + 1}/3)</span>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
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