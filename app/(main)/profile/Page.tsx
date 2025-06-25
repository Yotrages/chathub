'use client';

import React, { useState } from 'react';
import { User, Edit3, Settings, Camera, MapPin, Calendar, Link as LinkIcon } from 'lucide-react';
import { useApiController } from '@/hooks/useFetch';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  // Get current user profile
  const { data: profile, isLoading: loadingProfile, refetch } = useApiController({
    method: 'GET',
    url: 'profile/',
  });

  // Update profile
  const { register, handleSubmit, errors, isLoading: updatingProfile } = useApiController({
    method: 'PUT',
    url: 'profile/',
    successMessage: 'Profile updated successfully!',
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
  });

  // Get user posts
  const { data: userPosts, isLoading: loadingPosts } = useApiController({
    method: 'GET',
    url: 'profile/posts/',
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        <button className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30">
          <Camera className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-600" />
                )}
              </div>
              <button className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.name || 'User Name'}
              </h1>
              <p className="text-gray-600 mt-1">
                {profile?.bio || 'No bio available'}
              </p>
              
              <div className="flex items-center justify-center sm:justify-start space-x-4 mt-4 text-sm text-gray-500">
                {profile?.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {profile?.joinedDate || 'Recently'}</span>
                </div>
                {profile?.website && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="w-4 h-4" />
                    <a href={profile.website} className="text-blue-500 hover:underline">
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-8 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile?.postsCount || 0}</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile?.followersCount || 0}</p>
              <p className="text-sm text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile?.followingCount || 0}</p>
              <p className="text-sm text-gray-500">Following</p>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    defaultValue={profile?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    {...register('location')}
                    type="text"
                    defaultValue={profile?.location}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  defaultValue={profile?.bio}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  {...register('website')}
                  type="url"
                  defaultValue={profile?.website}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Profile Tabs */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'media'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Media
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {loadingPosts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : userPosts?.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No posts yet</p>
                  </div>
                ) : (
                  userPosts?.map((post: any) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <p className="text-gray-900">{post.content}</p>
                      <p className="text-sm text-gray-500 mt-2">{post.createdAt}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'media' && (
              <div className="grid grid-cols-3 gap-4">
                {/* Media grid would go here */}
                <div className="text-center py-12 col-span-3">
                  <p className="text-gray-500">No media yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
