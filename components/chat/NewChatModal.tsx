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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0 ml-2"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Chat Type Selection */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={() => setChatType('direct')}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg flex-1 text-xs sm:text-sm transition-colors ${
                chatType === 'direct'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageCircle size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Direct</span>
            </button>
            <button
              onClick={() => setChatType('group')}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg flex-1 text-xs sm:text-sm transition-colors ${
                chatType === 'group'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Group</span>
            </button>
          </div>
        </div>

        {/* Group Name and Avatar */}
        {chatType === 'group' && (
          <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 sm:mb-4"
            />
            <AvatarUpload
              label="Group Avatar"
              onFileSelect={setGroupAvatar}
              maxSize={5}
            />
          </div>
        )}

        {/* Selected Users Display - Collapsible */}
        {chatType === 'group' && selectedUsers.length > 0 && (
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-blue-50 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-blue-900">
                Selected ({selectedUsers.length})
              </span>
              {hasMoreSelected && (
                <button
                  onClick={() => setShowAllSelected(!showAllSelected)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  {showAllSelected ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      <span>Show all</span>
                      <ChevronDown size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {visibleSelectedUsers.map((selectedUser: any) => (
                <div
                  key={selectedUser._id}
                  className="flex items-center gap-1 sm:gap-1.5 bg-white px-2 py-1 rounded-full text-xs group hover:bg-gray-50 transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs">
                      {selectedUser.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="truncate max-w-[60px] sm:max-w-[80px]">
                    {selectedUser.username || 'Unknown'}
                  </span>
                  <button
                    onClick={() => handleUserToggle(selectedUser._id)}
                    className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors flex-shrink-0"
                  >
                    <X size={12} className="text-gray-500 group-hover:text-red-600" />
                  </button>
                </div>
              ))}
              {!showAllSelected && hasMoreSelected && (
                <div className="flex items-center px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                  +{selectedUserDetails.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 flex-shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* User List - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-2 sm:p-4">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8 text-sm">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">No users found</div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((userItem: any) => {
                  const isSelected = selectedUsers.includes(userItem._id);
                  return (
                    <div
                      key={userItem._id}
                      className={`flex items-center p-2 sm:p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''
                      }`}
                      onClick={() => handleUserToggle(userItem._id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleUserToggle(userItem._id)}
                        className="mr-2 sm:mr-3 accent-blue-500 flex-shrink-0 w-4 h-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {userItem.username?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">
                          {userItem.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
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

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateChat}
            disabled={!canCreate}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
              canCreate
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}