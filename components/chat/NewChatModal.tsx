'use client';
import { useState } from 'react';
import { X, Users, MessageCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useFetch } from '@/hooks/useFetch';
import { AvatarUpload } from './AvatarUpload';
import { useSelector } from 'react-redux';
import { RootState } from '@/libs/redux/store';

interface NewChatModalProps {
  onClose: () => void;
}

export const NewChatModal = ({ onClose }: NewChatModalProps) => {
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [showAllSelected, setShowAllSelected] = useState(false);

  const { createChat, uploadFile } = useChat();
  const { data: users, isLoading } = useFetch('/auth/users');
  const { user } = useSelector((state: RootState) => state.auth);

  const filteredUsers = users?.filter((userItem: any) =>
    (userItem.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     userItem.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    userItem._id !== user?._id
  ) || [];

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;

    try {
      let avatarUrl: string | undefined;
      if (groupAvatar) {
        const formData = new FormData();
        formData.append('file', groupAvatar);
        const uploadResult = await uploadFile(formData);
        avatarUrl = uploadResult.fileUrl;
      }

      if (chatType === 'group') {
        if (!groupName.trim()) return;
        await createChat(selectedUsers, 'group', groupName, avatarUrl);
      } else {
        await createChat(selectedUsers, 'direct');
      }

      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const canCreate = selectedUsers.length > 0 &&
    (chatType === 'direct' || (chatType === 'group' && groupName.trim()));

  const getSelectedUserDetails = () => {
    return selectedUsers.map(id => 
      filteredUsers.find((u: any) => u._id === id)
    ).filter(Boolean);
  };

  const selectedUserDetails = getSelectedUserDetails();
  const visibleSelectedUsers = showAllSelected ? selectedUserDetails : selectedUserDetails.slice(0, 3);
  const hasMoreSelected = selectedUserDetails.length > 3;

  return (
    <div className="fixed inset-0 bg-black m-0 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md flex flex-col" style={{ maxHeight: '70vh' }}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold truncate dark:text-gray-100">New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex-shrink-0 ml-2 transition-colors dark:text-gray-400"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 dark:bg-gray-800">
          {/* Chat Type Selection */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setChatType('direct');
                  setSelectedUsers([]);
                }}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg flex-1 text-xs sm:text-sm font-medium transition-colors ${
                  chatType === 'direct'
                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <MessageCircle size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Direct</span>
              </button>
              <button
                onClick={() => {
                  setChatType('group');
                  setSelectedUsers([]);
                }}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg flex-1 text-xs sm:text-sm font-medium transition-colors ${
                  chatType === 'group'
                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Users size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Group</span>
              </button>
            </div>
          </div>

          {/* Group Name and Avatar */}
          {chatType === 'group' && (
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
              <input
                type="text"
                placeholder="Group name (required)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 mb-3"
              />
              <AvatarUpload
                label="Group Avatar"
                onFileSelect={setGroupAvatar}
                maxSize={5}
              />
            </div>
          )}

          {/* Selected Users Display - Compact */}
          {chatType === 'group' && selectedUsers.length > 0 && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-300">
                  Selected: {selectedUsers.length}
                </span>
                {hasMoreSelected && (
                  <button
                    onClick={() => setShowAllSelected(!showAllSelected)}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    {showAllSelected ? (
                      <>
                        <span>Show less</span>
                        <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        <span>Show all</span>
                        <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Compact chips with max height */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-20 overflow-y-auto">
                {visibleSelectedUsers.map((selectedUser: any) => (
                  <div
                    key={selectedUser._id}
                    className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-gray-700 px-2 py-1 rounded-full text-xs group hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors dark:text-gray-100"
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {selectedUser.username?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="truncate max-w-[60px] sm:max-w-[80px] font-medium">
                      {selectedUser.username || 'Unknown'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserToggle(selectedUser._id);
                      }}
                      className="ml-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full p-0.5 transition-colors flex-shrink-0"
                    >
                      <X size={12} className="text-gray-500 group-hover:text-red-600 dark:text-gray-400 dark:group-hover:text-red-400" />
                    </button>
                  </div>
                ))}
                {!showAllSelected && hasMoreSelected && (
                  <div className="flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 font-medium">
                    +{selectedUserDetails.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search - Sticky */}
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 flex-shrink-0" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>

          {/* User List */}
          <div className="p-2 sm:p-3">
            {isLoading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12 text-sm">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12 text-sm">No users found</div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((userItem: any) => {
                  const isSelected = selectedUsers.includes(userItem._id);
                  return (
                    <div
                      key={userItem._id}
                      className={`flex items-center p-2 sm:p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50' : ''
                      }`}
                      onClick={() => handleUserToggle(userItem._id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="mr-2 sm:mr-3 accent-blue-500 flex-shrink-0 w-4 h-4 cursor-pointer"
                      />
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {userItem.username?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                          {userItem.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userItem.email}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateChat}
            disabled={!canCreate}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors font-medium ${
              canCreate
                ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}