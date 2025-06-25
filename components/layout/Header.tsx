"use client"
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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
    <div className=" bg-gray-50">
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
    </div>
  );
};

export default Header;