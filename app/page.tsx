"use client"
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/libs/redux/store';
import { validateTokenStart, validateTokenSuccess, validateTokenFailure } from '@/libs/redux/authSlice';
import { PostList } from '../components/post/PostList';
import { CreatePost } from '../components/post/CreatePost';
import { getCookie } from 'cookies-next';

const HomePage: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const validateAuth = async () => {
      const token = getCookie('auth-token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      if (!isAuthenticated && token) {
        dispatch(validateTokenStart());
      }
    };

    validateAuth();
  }, [isAuthenticated, router, dispatch]);

  // Show loading state while validating
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">SocialChat</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/chat')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Messages
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="user avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span>{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <span className="font-medium">{user?.username}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Create Post Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CreatePost />
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            <PostList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;

