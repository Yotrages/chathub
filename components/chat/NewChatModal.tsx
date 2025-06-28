'use client';
import { useState } from 'react';
import { X, Users, MessageCircle, Search } from 'lucide-react';
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

  const { createChat, uploadFile } = useChat();
  const { data: users, isLoading } = useFetch('/auth/users');
  const { user } = useSelector((state: RootState) => state.auth);

  const filteredUsers = users?.filter((userItem: any) =>
    (userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     userItem.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    userItem._id !== user?.id
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
        await createChat(selectedUsers, true, groupName, avatarUrl);
      } else {
        await createChat(selectedUsers, false);
      }

      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const canCreate = selectedUsers.length > 0 &&
    (chatType === 'direct' || (chatType === 'group' && groupName.trim()));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">New Chat</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Type Selection */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setChatType('direct')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                chatType === 'direct'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageCircle size={16} />
              <span>Direct Message</span>
            </button>
            <button
              onClick={() => setChatType('group')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                chatType === 'group'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={16} />
              <span>Group Chat</span>
            </button>
          </div>
        </div>

        {/* Group Name and Avatar */}
        {chatType === 'group' && (
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <AvatarUpload
              label="Group Avatar"
              onFileSelect={setGroupAvatar}
              maxSize={5}
            />
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center text-gray-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500">No users found</div>
          ) : (
            filteredUsers.map((userItem: any) => (
              <div
                key={userItem._id}
                className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => handleUserToggle(userItem._id)}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(userItem._id)}
                  onChange={() => handleUserToggle(userItem._id)}
                  className="mr-3"
                />
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">
                    {userItem.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{userItem.name || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500">{userItem.email}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateChat}
            disabled={!canCreate}
            className={`px-4 py-2 rounded-lg ${
              canCreate
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Create Chat
          </button>
        </div>
      </div>
    </div>
  );
};
