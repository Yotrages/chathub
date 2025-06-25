'use client';

import React, { useState } from 'react';
import { PostList } from '@/components/post/PostList';
import { MessageCircle, Users, Search, Bell, Settings, User } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ChatApp</h1>
            </div>

            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'feed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Feed
              </button>
              <Link
                href="/chat"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Messages
              </Link>
              <Link
                href="/groups"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Groups
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
              <Link
                href="/profile"
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <User className="h-5 w-5" />
              </Link>
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 py-6 pr-8">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('feed')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'feed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Feed
              </button>
              <Link
                href="/chat"
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <MessageCircle className="mr-3 h-5 w-5" />
                Messages
              </Link>
              <Link
                href="/groups"
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <Users className="mr-3 h-5 w-5" />
                Groups
              </Link>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 py-6">
            {activeTab === 'feed' && <PostList />}
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-80 py-6 pl-8">
            <div className="space-y-6">
              {/* Trending Posts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Trending
                </h3>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">#TechTalk</p>
                    <p className="text-gray-500">125 posts</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">#WebDev</p>
                    <p className="text-gray-500">89 posts</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">#Design</p>
                    <p className="text-gray-500">67 posts</p>
                  </div>
                </div>
              </div>

              {/* Suggested Users */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  People you may know
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            User {i}
                          </p>
                          <p className="text-xs text-gray-500">2 mutual friends</p>
                        </div>
                      </div>
                      <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600">
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
