'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Settings, UserPlus, MoreVertical } from 'lucide-react';
import { useApiController } from '@/hooks/useFetch';
import Link from 'next/link';
import { z } from 'zod';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  avatar?: string;
  isAdmin: boolean;
  lastActivity: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch groups
  const { data: groupsData, isLoading: loadingGroups, refetch } = useApiController({
    method: 'GET',
    url: 'groups/',
  });

  // Create group
  const { register, handleSubmit, errors, isLoading: creatingGroup } = useApiController({
    method: 'POST',
    url: 'groups/',
    schema: z.object({
      name: z.string().min(1, 'Group name is required'),
      description: z.string().optional(),
    }),
    successMessage: 'Group created successfully!',
    onSuccess: () => {
      setShowCreateModal(false);
      refetch?.();
    },
  });

  useEffect(() => {
    if (groupsData) {
      setGroups(groupsData.data || groupsData);
    }
  }, [groupsData]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
                <p className="text-sm text-gray-500">Manage your group conversations</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {loadingGroups ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No groups found' : 'No groups yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first group to start collaborating'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        {group.avatar ? (
                          <img
                            src={group.avatar}
                            alt={group.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {group.memberCount} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {group.isAdmin && (
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Settings className="h-4 w-4" />
                        </button>
                      )}
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {group.description || 'No description available'}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Active {group.lastActivity}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-green-600">
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/chat?group=${group.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200"
                      >
                        Open Chat
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  {...register?.('name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter group name"
                />
                {errors?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's this group about?"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
